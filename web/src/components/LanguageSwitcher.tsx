import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const languages = [
        { code: 'tj', name: 'Тоҷикӣ' },
        { code: 'ru', name: 'Русский' },
        { code: 'en', name: 'English' },
    ];

    // Try to find current language code (could be 'tj-TJ' etc)
    const currentLanguage = i18n.language?.split('-')[0] || 'tj';

    return (
        <div className="flex items-center gap-2 px-3 py-2 group">
            <Globe className="h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            <select
                value={currentLanguage}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="bg-transparent text-xs font-semibold text-gray-500 hover:text-gray-900 focus:outline-none cursor-pointer transition-colors"
            >
                {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                        {lang.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
