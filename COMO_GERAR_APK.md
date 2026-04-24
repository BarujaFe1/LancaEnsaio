# Como Gerar APK Localmente

## Pré-requisitos

1. **Android Studio** instalado com:
   - Android SDK
   - Android SDK Build-Tools
   - Android Emulator (opcional)

2. **Java JDK** (versão 17 ou superior)

3. **Variáveis de ambiente** configuradas:
   ```
   ANDROID_HOME=C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk
   JAVA_HOME=C:\Program Files\Java\jdk-17
   ```

4. **EAS CLI** instalado globalmente:
   ```bash
   npm install -g eas-cli
   ```

## Método 1: Build Local com EAS (Recomendado)

### Passo 1: Configurar credenciais
```bash
cd "D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos\mobile"
eas login
```

### Passo 2: Gerar APK local
```bash
eas build --platform android --profile local --local
```

O APK será gerado em: `mobile/build-XXXXXXXX.apk`

## Método 2: Build Nativo com Expo

### Passo 1: Pré-build
```bash
cd "D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos\mobile"
npx expo prebuild --platform android
```

### Passo 2: Build com Gradle
```bash
cd android
.\gradlew assembleRelease
```

O APK será gerado em: `android/app/build/outputs/apk/release/app-release.apk`

## Método 3: Build na Nuvem (Mais Simples)

### Passo 1: Login no EAS
```bash
cd "D:\Dev\Projetos VibeCoding\LancaEnsaioIrmaos\mobile"
eas login
```

### Passo 2: Build na nuvem
```bash
eas build --platform android --profile production
```

Aguarde o build terminar (10-20 minutos) e baixe o APK do link fornecido.

## Instalação do APK

### No celular via USB
1. Conectar celular no computador via USB
2. Habilitar "Depuração USB" no celular (Configurações → Opções do desenvolvedor)
3. Copiar o APK para o celular
4. Instalar o APK no celular

### No celular via link
1. Fazer upload do APK para Google Drive ou similar
2. Abrir o link no celular
3. Baixar e instalar

## Troubleshooting

### Erro: "ANDROID_HOME not set"
Configurar variável de ambiente:
```powershell
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk', 'User')
```

### Erro: "Java not found"
Instalar Java JDK 17 e configurar JAVA_HOME.

### Erro: "Gradle build failed"
Limpar cache e tentar novamente:
```bash
cd android
.\gradlew clean
.\gradlew assembleRelease
```

## Configuração do .env para Produção

Antes de gerar o APK, certifique-se de que o `.env` está correto:

```env
EXPO_PUBLIC_API_URL=https://jzkozhnuyewnjwfgjhaa.supabase.co/functions/v1/api
```

## Versão e Build Number

Para atualizar a versão do app, edite `app.json`:

```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

Incrementar `versionCode` a cada novo build.
