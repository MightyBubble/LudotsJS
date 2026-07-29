import React from 'react';
import { Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/i18n/I18nProvider';

export default function LocaleSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="flex items-center gap-1" title={t('locale.label')}>
      <Languages className="w-3.5 h-3.5 text-muted-foreground" />
      <Select value={locale} onValueChange={setLocale}>
        <SelectTrigger className="h-7 w-[92px] border-input bg-background px-2 text-xs text-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="zh-CN">{t('locale.zh')}</SelectItem>
          <SelectItem value="en-US">{t('locale.en')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}