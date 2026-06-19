import { useTranslation } from 'react-i18next';

import { ModalScreen } from '@/components/ui/ModalScreen';
import { personal } from '@/personal/personal.config';

export default function About() {
  const { t } = useTranslation();
  return (
    <ModalScreen
      title={t('common.appName')}
      message={personal.dedicationLine}
      footnote={t('common.notMedicalAdvice')}
    />
  );
}
