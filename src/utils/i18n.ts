/**
 * Internationalization (i18n) utilities
 * Made with love by eiyuumiru
 */

import { useState, useEffect, useCallback } from 'react';

export type Language = 'vi' | 'en';

// Comprehensive translations
const translations = {
    vi: {
        // Header
        appSubtitle: 'AI Chat phong cách Studygram tối giản cho học tập & làm việc',

        // Settings dropdown
        settings: 'Cài đặt',
        help: 'Hướng dẫn',
        changelog: 'Lịch sử cập nhật',
        darkMode: 'Chế độ tối',
        lightMode: 'Chế độ sáng',
        github: 'Mã nguồn',
        language: 'Tiếng Việt',
        account: 'Tài khoản',
        signIn: 'Đăng nhập',
        signOut: 'Đăng xuất',
        guest: 'Khách',
        credits: 'Credits',
        totalUsage: 'Tổng sử dụng',
        usageThisMonth: 'Tháng này',
        loadingUsage: 'Đang tải...',
        errorLoadingUsage: 'Không thể tải dữ liệu',
        refreshUsage: 'Làm mới',
        accountPool: 'Account Pool',
        accountPoolOn: 'Đang bật',
        accountPoolOff: 'Đang tắt',
        active: 'Hoạt động',
        exhausted: 'Hết hạn',

        // Help Modal
        helpTitle: '📚 Hướng dẫn sử dụng',
        helpPurposeTitle: 'Mục đích',
        helpPurposeText: 'PaperChat là ứng dụng AI Chat hoàn toàn miễn phí, sử dụng Puter.js để kết nối với các mô hình AI hàng đầu như GPT-5.2, Claude, Gemini và nhiều model khác.',
        helpLimitTitle: 'Giới hạn API',
        helpLimitText: 'Mặc dù miễn phí hoàn toàn, Puter.js vẫn có giới hạn về số lượng request API cho mỗi tài khoản. Khi bạn gặp lỗi "API limit exceeded" hoặc chatbot không phản hồi, hãy làm theo hướng dẫn bên dưới.',
        helpFixTitle: 'Cách khắc phục khi tràn API',
        helpStep1: 'Xoá cookie của trang web này',
        helpStep2: 'Xoá cookie của puter.com',
        helpStep3: 'Quay lại PaperChat và gửi tin nhắn bất kỳ',
        helpStep4: 'Hệ thống sẽ tự động tạo tài khoản mới → Xong! ✨',
        helpFooter: 'Made with 💖 by',

        // Changelog Modal
        changelogTitle: '📋 Changelog',

        // Tabs
        tabChat: 'Chat văn bản',

        // Chat Panel
        selectModel: 'Chọn Model:',
        chatPlaceholder: 'Nhập tin nhắn của bạn...',
        chatPlaceholderWithFiles: 'Nhập câu hỏi về {count} file...',
        send: 'Gửi',
        clearHistory: 'Xoá lịch sử',
        you: 'Bạn',
        ai: 'AI',
        clearAll: 'Xóa tất cả',
        clearAllFiles: 'Xóa tất cả files',
        removeFile: 'Xóa file',
        attachFile: 'Đính kèm file',
        modelNoFileUpload: 'Model này không hỗ trợ upload file',
        modelNoFileUploadReset: 'Model này không hỗ trợ upload file. Đã xóa các file đính kèm.',
        maxFilesError: 'Chỉ có thể đính kèm tối đa {count} files.',
        images: 'ảnh',
        documents: 'tài liệu',
        webSearchOn: 'Bật tìm kiếm web',
        webSearchOff: 'Tắt tìm kiếm web',
        webSearchBuiltIn: 'Model này đã có sẵn tìm kiếm web',
        searchingWeb: 'Đang tìm kiếm web...',
        step: 'Bước',

        // Welcome Message
        welcomeTitle: 'Xin chào!',
        welcomeText: 'Mình là trợ lý AI của bạn. Hãy hỏi bất cứ điều gì nhé!',
        free: 'Miễn phí',
        unlimited: 'không giới hạn',
        tipQuantum: 'Giải thích quantum computing',
        tipQuantumPrompt: 'Giải thích quantum computing đơn giản',
        tipPoem: 'Viết thơ về mùa thu',
        tipPoemPrompt: 'Viết một bài thơ về mùa thu',
        tipStartup: 'Ý tưởng startup',
        tipStartupPrompt: 'Cho tôi 5 ý tưởng startup công nghệ',

        // Model groups
        other: 'Khác',

        // Footer  
        madeWith: 'Made with 💕 using',

        // Common
        and: 'và',
    },
    en: {
        // Header
        appSubtitle: 'Minimalist Studygram-style AI Chat for study & work',

        // Settings dropdown
        settings: 'Settings',
        help: 'Help',
        changelog: 'Changelog',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        github: 'Source Code',
        language: 'English',
        account: 'Account',
        signIn: 'Sign In',
        signOut: 'Sign Out',
        guest: 'Guest',
        credits: 'Credits',
        totalUsage: 'Total Usage',
        usageThisMonth: 'This Month',
        loadingUsage: 'Loading...',
        errorLoadingUsage: 'Failed to load',
        refreshUsage: 'Refresh',
        accountPool: 'Account Pool',
        accountPoolOn: 'On',
        accountPoolOff: 'Off',
        active: 'Active',
        exhausted: 'Exhausted',

        // Help Modal
        helpTitle: '📚 User Guide',
        helpPurposeTitle: 'Purpose',
        helpPurposeText: 'PaperChat is a completely free AI Chat app, using Puter.js to connect with top AI models like GPT-5.2, Claude, Gemini and more.',
        helpLimitTitle: 'API Limits',
        helpLimitText: 'Although completely free, Puter.js has request limits per account. When you encounter "API limit exceeded" errors or the chatbot stops responding, follow the instructions below.',
        helpFixTitle: 'How to fix API overflow',
        helpStep1: 'Clear cookies for this website',
        helpStep2: 'Clear cookies for puter.com',
        helpStep3: 'Return to PaperChat and send any message',
        helpStep4: 'The system will automatically create a new account → Done! ✨',
        helpFooter: 'Made with 💖 by',

        // Changelog Modal
        changelogTitle: '📋 Changelog',

        // Tabs
        tabChat: 'Text Chat',

        // Chat Panel
        selectModel: 'Select Model:',
        chatPlaceholder: 'Type your message...',
        chatPlaceholderWithFiles: 'Ask about {count} file(s)...',
        send: 'Send',
        clearHistory: 'Clear History',
        you: 'You',
        ai: 'AI',
        clearAll: 'Clear All',
        clearAllFiles: 'Clear all files',
        removeFile: 'Remove file',
        attachFile: 'Attach file',
        modelNoFileUpload: 'This model does not support file upload',
        modelNoFileUploadReset: 'This model does not support file upload. Attached files have been removed.',
        maxFilesError: 'Maximum {count} files can be attached.',
        images: 'images',
        documents: 'documents',
        webSearchOn: 'Enable web search',
        webSearchOff: 'Disable web search',
        webSearchBuiltIn: 'This model has built-in web search',
        searchingWeb: 'Searching the web...',
        step: 'Step',

        // Welcome Message
        welcomeTitle: 'Hello!',
        welcomeText: 'I\'m your AI assistant. Feel free to ask me anything!',
        free: 'Free',
        unlimited: 'unlimited',
        tipQuantum: 'Explain quantum computing',
        tipQuantumPrompt: 'Explain quantum computing simply',
        tipPoem: 'Write a poem about autumn',
        tipPoemPrompt: 'Write a poem about autumn',
        tipStartup: 'Startup ideas',
        tipStartupPrompt: 'Give me 5 tech startup ideas',

        // Model groups
        other: 'Other',

        // Footer
        madeWith: 'Made with 💕 using',

        // Common
        and: 'and',
    },
} as const;

export type TranslationKey = keyof typeof translations.vi;

// Get stored language or default to Vietnamese
function getStoredLanguage(): Language {
    if (typeof window === 'undefined') return 'vi';
    return (localStorage.getItem('language') as Language) || 'vi';
}

// Simple hook for language - no context needed
export function useLanguage() {
    const [language, setLanguageState] = useState<Language>(getStoredLanguage);

    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
    }, []);

    const toggleLanguage = useCallback(() => {
        const newLang = language === 'vi' ? 'en' : 'vi';
        localStorage.setItem('language', newLang);
        window.location.reload();
    }, [language]);

    const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
        let text: string = translations[language][key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, String(v));
            });
        }
        return text;
    }, [language]);

    return { language, setLanguage, toggleLanguage, t };
}

// Standalone translate function (for non-hook contexts)
export function translate(key: TranslationKey, lang?: Language, params?: Record<string, string | number>): string {
    const language = lang || getStoredLanguage();
    let text: string = translations[language][key] || key;
    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            text = text.replace(`{${k}}`, String(v));
        });
    }
    return text;
}
