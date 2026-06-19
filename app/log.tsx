import { useTranslation } from 'react-i18next';

import { ModalScreen } from '@/components/ui/ModalScreen';

export default function Log() {
  const { t } = useTranslation();
  return <ModalScreen title={t('tabs.home')} message={t('screens.log')} />;
}
