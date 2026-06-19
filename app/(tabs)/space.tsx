import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

export default function Space() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen title={t('tabs.space')} message={t('screens.space')} />
  );
}
