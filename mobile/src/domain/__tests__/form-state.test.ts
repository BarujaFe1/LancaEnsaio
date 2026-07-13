import { initialFormState, limparFormularioState } from '../../utils/form-state';

describe('limparFormularioState', () => {
  it('preserva cidade quando travaCidade=true', () => {
    const current = {
      ...initialFormState,
      cidade: 'Sertãozinho',
      cidadeCustom: 'Custom',
      categoria: 'Cordas',
      instrumento: 'Violão',
      ministerio: 'X',
      musicaCargo: 'Y',
    };

    expect(limparFormularioState(current, true)).toEqual({
      cidade: 'Sertãozinho',
      cidadeCustom: 'Custom',
      categoria: '',
      instrumento: '',
      ministerio: '',
      musicaCargo: '',
    });
  });

  it('limpa tudo quando travaCidade=false', () => {
    const current = {
      ...initialFormState,
      cidade: 'Sertãozinho',
      categoria: 'Cordas',
    };
    expect(limparFormularioState(current, false).cidade).toBe('');
  });
});
