import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

export default function Plan() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen title={t('tabs.plan')} message={t('screens.plan')} />
  );
}
