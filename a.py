from pathlib import Path

pasta = Path(r"D:\Códigos\LancaEnsaio")

if not pasta.exists():
    print(f"Pasta não encontrada: {pasta}")
else:
    arquivos = sorted([p for p in pasta.rglob("*") if p.is_file()])

    print(f"Total de arquivos: {len(arquivos)}\n")

    for arquivo in arquivos:
        print(arquivo)
