import type { ImageSourcePropType } from 'react-native';

export type Specialty = {
  id: string;
  label: string;
  icon: ImageSourcePropType;
};

/**
 * Lista de especialidades exibidas na Home. O `id` é usado na rota
 * /especialidade/[id] e para ligar os médicos à especialidade no banco.
 *
 * Os ícones agora são PNGs próprios (assets/specialties/*.png),
 * no lugar dos ícones da biblioteca de vetores.
 */
export const SPECIALTIES: Specialty[] = [
  { id: 'clinico-geral', label: 'Clínico Geral', icon: require('../../assets/specialties/clinico-geral.png') },
  { id: 'pediatria', label: 'Pediatria', icon: require('../../assets/specialties/pediatria.png') },
  { id: 'cardiologia', label: 'Cardiologia', icon: require('../../assets/specialties/cardiologia.png') },
  { id: 'odontologia', label: 'Odontologia', icon: require('../../assets/specialties/odontologia.png') },
  { id: 'psicologia', label: 'Psicologia', icon: require('../../assets/specialties/psicologia.png') },
  { id: 'ginecologia', label: 'Ginecologia', icon: require('../../assets/specialties/ginecologia.png') },
  { id: 'geriatria', label: 'Geriatria', icon: require('../../assets/specialties/geriatria.png') },
  { id: 'oncologia', label: 'Oncologia', icon: require('../../assets/specialties/oncologia.png') },
];