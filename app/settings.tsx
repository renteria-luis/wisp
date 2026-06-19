import { useTranslation } from 'react-i18next';

import { ModalScreen } from '@/components/ui/ModalScreen';

export default function Settings() {
  const { t } = useTranslation();
  return (
    <ModalScreen title={t('tabs.space')} message={t('screens.settings')} />
  );
}
