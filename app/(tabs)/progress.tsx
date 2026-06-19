import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/ui/PlaceholderScreen';

export default function Progress() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('tabs.progress')}
      message={t('screens.progress')}
    />
  );
}
