// google-apps-script/Code.gs
// Integração direta do LançaEnsaio com o Google Sheets
// Cole este código em: Extensões > Apps Script na planilha do Google
// Depois clique em Implantar > Nova Implantação > App da Web (Acesso: Qualquer pessoa)

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetBase = ss.getSheetByName('Base Geral');
  
  if (!sheetBase) {
    return jsonResponse({ sucesso: false, erro: 'Aba Base Geral não encontrada' });
  }
  
  var lastRow = sheetBase.getLastRow();
  var values = lastRow > 1 ? sheetBase.getRange(2, 1, lastRow - 1, 8).getValues() : [];
  
  var cordas = [];
  var metais = [];
  var madeiras = [];
  var teclas = [];
  var cidadesSemAcento = [];
  var ministerios = [];
  var cargosMusicais = [];
  var cidadesComAcento = [];
  
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (r[0] && String(r[0]).trim()) cordas.push(String(r[0]).trim());
    if (r[1] && String(r[1]).trim()) metais.push(String(r[1]).trim());
    if (r[2] && String(r[2]).trim()) madeiras.push(String(r[2]).trim());
    if (r[3] && String(r[3]).trim()) teclas.push(String(r[3]).trim());
    if (r[4] && String(r[4]).trim()) cidadesSemAcento.push(String(r[4]).trim());
    if (r[5] && String(r[5]).trim()) ministerios.push(String(r[5]).trim());
    if (r[6] && String(r[6]).trim()) cargosMusicais.push(String(r[6]).trim());
    if (r[7] && String(r[7]).trim()) cidadesComAcento.push(String(r[7]).trim());
  }
  
  return jsonResponse({
    sucesso: true,
    instrumentos: {
      Cordas: dedupe(cordas),
      Metais: dedupe(metais),
      Madeiras: dedupe(madeiras),
      Teclas: dedupe(teclas)
    },
    cidades: dedupe(cidadesComAcento.length ? cidadesComAcento : cidadesSemAcento),
    ministerios: dedupe(ministerios),
    cargosMusicais: dedupe(cargosMusicais)
  });
}

function doPost(e) {
  try {
    var raw = '';
    if (e.postData) {
      if (e.postData.getDataAsString) {
        try { raw = e.postData.getDataAsString('UTF-8'); } catch(ex) {}
      }
      if (!raw && e.postData.contents) {
        raw = e.postData.contents;
      }
    }
    if (!raw) raw = '{}';
    var data = JSON.parse(raw);
    var action = data.action || 'registro';
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === 'adicionarCidade') {
      var novaCidade = data.cidade ? fixEncoding(String(data.cidade).trim()) : '';
      if (!novaCidade) {
        return jsonResponse({ sucesso: false, erro: 'Nome de cidade inválido' });
      }
      var sheetBase = ss.getSheetByName('Base Geral');
      if (sheetBase) {
        var lastBase = sheetBase.getLastRow();
        var hVals = lastBase > 1 ? sheetBase.getRange(2, 8, lastBase - 1, 1).getValues() : [];
        var jaExiste = false;
        var primeiraLinhaVazia = -1;
        for (var i = 0; i < hVals.length; i++) {
          if (String(hVals[i][0]).trim().toLowerCase() === novaCidade.toLowerCase()) {
            jaExiste = true;
            break;
          }
          if (!hVals[i][0] && primeiraLinhaVazia === -1) {
            primeiraLinhaVazia = i + 2;
          }
        }
        if (!jaExiste) {
          if (primeiraLinhaVazia === -1) primeiraLinhaVazia = lastBase + 1;
          sheetBase.getRange(primeiraLinhaVazia, 8).setValue(novaCidade);
        }
      }
      return jsonResponse({ sucesso: true, cidade: novaCidade });
    }

    var sheetDados = ss.getSheetByName('Dados Geral');
    if (!sheetDados) {
      return jsonResponse({ sucesso: false, erro: 'Aba Dados Geral não encontrada' });
    }
    
    var nowBR = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'dd/MM/yyyy, HH:mm:ss');
    
    if (action === 'alerta') {
      var idAlerta = data.id;
      var aviso = fixEncoding(data.aviso || '');
      var nomeLancador = fixEncoding(data.nomeLancador || '');
      
      var lastRow = sheetDados.getLastRow();
      if (lastRow < 2) {
        return jsonResponse({ sucesso: false, erro: 'Nenhum registro para alertar' });
      }
      
      var ids = sheetDados.getRange(2, 2, lastRow - 1, 1).getValues();
      var targetRow = -1;
      for (var i = ids.length - 1; i >= 0; i--) {
        if (ids[i][0] === idAlerta) {
          targetRow = i + 2;
          break;
        }
      }
      
      if (targetRow === -1) {
        return jsonResponse({ sucesso: false, erro: 'Registro não encontrado' });
      }
      
      var cellAudit = sheetDados.getRange(targetRow, 8);
      var currentAudit = cellAudit.getValue() || '';
      var novoAlerta = ' | ALERTA (' + nowBR + ' - ' + nomeLancador + '): ' + aviso;
      cellAudit.setValue(currentAudit + novoAlerta);
      
      return jsonResponse({ sucesso: true, mensagem: 'Alerta adicionado com sucesso' });
    }
    
    // Novo Registro
    var tipo = data.tipo || 'IRMAOS';
    var nomeLancador = fixEncoding(data.nomeLancador || 'Anonimo');
    var cidade = fixEncoding(data.cidade || '');
    var categoria = data.categoria || '-';
    var instrumento = data.instrumento || '-';
    var ministerio = data.ministerio || '-';
    var musicaCargo = data.musicaCargo || '-';
    
    // Auditoria
    var cargoFinal = musicaCargo;
    var auditoriaMsgs = [];
    
    if (tipo === 'IRMAS') {
      if (!cidade) auditoriaMsgs.push('ERRO 01: 🏙️ Falta Cidade');
      if (!musicaCargo || musicaCargo === '-') {
        cargoFinal = 'Cantora';
      }
    } else {
      // IRMÃOS
      var isVazio = (!categoria || categoria === '-') && (!instrumento || instrumento === '-') && (!ministerio || ministerio === '-') && (!musicaCargo || musicaCargo === '-');
      if (isVazio) {
        cargoFinal = 'Cantor';
      }
      if (!cidade) auditoriaMsgs.push('ERRO 01: 🏙️ Falta Cidade');
      if (ministerio && ministerio !== '-' && instrumento && instrumento !== '-') {
        auditoriaMsgs.push('ERRO 11: 👔 Min Tocando');
      }
    }
    
    // Gerar ID
    var idGerado = (data.id && String(data.id).trim()) ? String(data.id).trim() : gerarId(tipo, nomeLancador);
    var meta = 'META APP=UNIFICADO TIPO=' + tipo + ' USER=' + nomeLancador;
    var colunaAudit = (auditoriaMsgs.length > 0 ? auditoriaMsgs.join(' | ') + ' | ' : '') + meta;
    
    var novaLinha = [
      nowBR,
      idGerado,
      categoria,
      instrumento,
      cidade,
      ministerio,
      cargoFinal,
      colunaAudit
    ];
    
    sheetDados.appendRow(novaLinha);
    
    var comprovante = {
      id: idGerado,
      horario: nowBR,
      cidade: cidade,
      instrumento: instrumento,
      ministerio: ministerio,
      musica: cargoFinal,
      auditoria: 'Lançado por ' + nomeLancador
    };
    
    return jsonResponse({
      sucesso: true,
      idGerado: idGerado,
      comprovante: comprovante
    });
    
  } catch (err) {
    return jsonResponse({ sucesso: false, erro: String(err) });
  }
}

function gerarId(tipo, nome) {
  var rand = Math.floor(Math.random() * 9000 + 1000).toString();
  if (tipo === 'IRMAS') return 'F' + rand;
  var palavras = (nome || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z\s]/g, '').split(/\s+/).filter(Boolean);
  var partes = palavras.map(function(p) { return p.slice(0, 3); }).join('');
  return 'M' + (partes || 'USR') + rand;
}

function dedupe(arr) {
  var out = [];
  var seen = {};
  for (var i = 0; i < arr.length; i++) {
    var v = arr[i];
    if (v && v !== '-' && !seen[v]) {
      seen[v] = true;
      out.push(v);
    }
  }
  return out;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function fixEncoding(str) {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(/Ribeir[\ufffd\?]+o/gi, 'Ribeirão')
    .replace(/S[\ufffd\?]+o/gi, 'São')
    .replace(/Jardin[\ufffd\?]+polis/gi, 'Jardinópolis')
    .replace(/Sert[\ufffd\?]+ozinho/gi, 'Sertãozinho')
    .replace(/C[\ufffd\?]+ndido/gi, 'Cândido')
    .replace(/M[\ufffd\?]+rio/gi, 'Mário')
    .replace(/Jos[\ufffd\?]+/gi, 'José')
    .replace(/Tib[\ufffd\?]+rio/gi, 'Tibério')
    .replace(/Virg[\ufffd\?]+nia/gi, 'Virgínia')
    .replace(/Altin[\ufffd\?]+polis/gi, 'Altinópolis')
    .replace(/C[\ufffd\?]+ssia/gi, 'Cássia')
    .replace(/Col[\ufffd\?]+mbia/gi, 'Colômbia')
    .replace(/Gua[\ufffd\?]+ra/gi, 'Guaíra')
    .replace(/Guar[\ufffd\?]+/gi, 'Guará')
    .replace(/Ipu[\ufffd\?]+/gi, 'Ipuã')
    .replace(/Itirapu[\ufffd\?]+/gi, 'Itirapuã')
    .replace(/Lu[\ufffd\?]+s Ant[\ufffd\?]+nio/gi, 'Luís Antônio')
    .replace(/Miguel[\ufffd\?]+polis/gi, 'Miguelópolis')
    .replace(/Orl[\ufffd\?]+ndia/gi, 'Orlândia')
    .replace(/Patroc[\ufffd\?]+nio/gi, 'Patrocínio');
}
