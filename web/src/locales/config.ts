import i18n from 'i18next';
import { upperFirst } from 'lodash';
import { initReactI18next } from 'react-i18next';

import { LanguageAbbreviation } from '@/constants/common';

import translation_en from './en';

const languageImports: Record<string, () => Promise<{ default: any }>> = {
  [LanguageAbbreviation.En]: () => import('./en'),
  [LanguageAbbreviation.Zh]: () => import('./zh'),
  [LanguageAbbreviation.ZhTraditional]: () => import('./zh-traditional'),
  [LanguageAbbreviation.Id]: () => import('./id'),
  [LanguageAbbreviation.Ja]: () => import('./ja'),
  [LanguageAbbreviation.Es]: () => import('./es'),
  [LanguageAbbreviation.Vi]: () => import('./vi'),
  [LanguageAbbreviation.Ru]: () => import('./ru'),
  [LanguageAbbreviation.PtBr]: () => import('./pt-br'),
  [LanguageAbbreviation.De]: () => import('./de'),
  [LanguageAbbreviation.Fr]: () => import('./fr'),
  [LanguageAbbreviation.It]: () => import('./it'),
  [LanguageAbbreviation.Bg]: () => import('./bg'),
  [LanguageAbbreviation.Ar]: () => import('./ar'),
};

const supportedLanguageCodes: Intl.UnicodeBCP47LocaleIdentifier[] =
  Object.keys(languageImports);

export const supportedLanguages = supportedLanguageCodes.map((code) => {
  const locale = new Intl.Locale(code);

  return {
    code,
    locale,
    displayName: upperFirst(
      new Intl.DisplayNames(locale, { type: 'language' }).of(code)!,
    ),
  };
});

export const DEFAULT_LANGUAGE_CODE = LanguageAbbreviation.Zh;

const resources = {
  [LanguageAbbreviation.En]: translation_en,
};

i18n
  .use(initReactI18next)
  // .use(LanguageDetector) // 禁用浏览器语言检测，强制使用中文
  .init({
    supportedLngs: supportedLanguageCodes,
    resources,
    lng: DEFAULT_LANGUAGE_CODE, // 强制使用中文作为默认语言
    interpolation: {
      escapeValue: false,
    },
  });

export const loadLanguageAsync = async (lng: string): Promise<void> => {
  // const normalizedLng = normalizeLanguageCode(lng);
  const normalizedLng = lng;

  if (i18n.hasResourceBundle(normalizedLng, 'translation')) {
    return;
  }

  const importFn = languageImports[normalizedLng];
  if (!importFn) {
    console.warn(`Language ${lng} is not supported for lazy loading`);
    return;
  }

  try {
    const module = await importFn();
    const translationData = module.default?.translation || module.default;
    i18n.addResourceBundle(normalizedLng, 'translation', translationData);
  } catch (error) {
    console.error(`Failed to load language ${lng}:`, error);
  }
};

export const changeLanguageAsync = async (lng: string): Promise<void> => {
  // const normalizedLng = normalizeLanguageCode(lng);
  const normalizedLng = lng;

  if (
    normalizedLng !== LanguageAbbreviation.En &&
    !i18n.hasResourceBundle(normalizedLng, 'translation')
  ) {
    await loadLanguageAsync(normalizedLng);
  }
  await i18n.changeLanguage(normalizedLng);
};

export const initLanguage = async (): Promise<void> => {
  // const currentLng = normalizeLanguageCode(
  //   i18n.language || localStorage.getItem('lng') || LanguageAbbreviation.En,
  // );

  const currentLng =
    i18n.language || localStorage.getItem('lng') || DEFAULT_LANGUAGE_CODE;

  await changeLanguageAsync(currentLng);
};

export default i18n;
