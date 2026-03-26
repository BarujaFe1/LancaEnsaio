export type FormState = {
  cidade: string;
  cidadeCustom: string;
  categoria: string;
  instrumento: string;
  ministerio: string;
  musicaCargo: string;
};

export const initialFormState: FormState = {
  cidade: '',
  cidadeCustom: '',
  categoria: '',
  instrumento: '',
  ministerio: '',
  musicaCargo: ''
};

/**
 * Script EXATO da limpeza:
 * - Preserva cidade/cidadeCustom quando travaCidade=true
 * - Limpa os demais campos sempre
 */
export function limparFormularioState(
  current: FormState,
  travaCidade: boolean
): FormState {
  return {
    cidade: travaCidade ? current.cidade : '',
    cidadeCustom: travaCidade ? current.cidadeCustom : '',
    categoria: '',
    instrumento: '',
    ministerio: '',
    musicaCargo: ''
  };
}
