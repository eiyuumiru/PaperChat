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
        appSubtitle: 'AI Chat, Image & Video Generation với phong cách Studygram',

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

        // Help Modal
        helpTitle: '📚 Hướng dẫn sử dụng',
        helpPurposeTitle: 'Mục đích',
        helpPurposeText: 'PaperChat là ứng dụng AI Chat & Image Generation hoàn toàn miễn phí, sử dụng Puter.js để kết nối với các mô hình AI hàng đầu như GPT-5.2, Claude, Gemini và nhiều model khác.',
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
        tabImage: 'Tạo hình ảnh',
        tabVideo: 'Tạo video',

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

        // Image Panel
        imageWarning: 'Tạo ảnh có thể không ổn định và tốn nhiều credits.',
        note: 'Lưu ý:',
        describeEdit: 'Mô tả chỉnh sửa:',
        describeImage: 'Mô tả hình ảnh:',
        editPlaceholder: 'Mô tả cách bạn muốn chỉnh sửa ảnh... Ví dụ: Thêm mũ phù thủy cho nhân vật, đổi nền thành bãi biển',
        imagePlaceholder: 'Mô tả chi tiết hình ảnh bạn muốn tạo... Ví dụ: A cute cat wearing a wizard hat, digital art style, vibrant colors',
        sourceImageLabel: 'Ảnh gốc (tùy chọn - để chỉnh sửa):',
        removeSourceImage: 'Xóa ảnh gốc',
        dropImageHere: 'Kéo thả ảnh vào đây hoặc nhấn để chọn',
        imageFormats: 'Hỗ trợ: JPEG, PNG, GIF, WebP (tối đa 5MB)',
        editImage: 'Chỉnh sửa ảnh',
        generateImage: 'Tạo hình ảnh',
        generating: 'Đang tạo...',
        imageLoadingText: 'AI đang vẽ cho bạn...',
        imageLoadingSubtext: 'Hãy chờ một chút nha!',
        imagePlaceholderText: 'Hình ảnh được tạo sẽ hiển thị ở đây',
        imagePlaceholderHint: 'Nhập prompt và nhấn "Tạo hình ảnh"',

        // Video Panel
        betaVideoWarning: 'Tính năng này đang trong giai đoạn Beta, có thể không hoạt động và tốn RẤT NHIỀU credits.',
        videoFeaturePaused: 'Tính năng tạm ngừng:',
        videoNotWorking: 'Tạo video hiện không hoạt động do',
        puterBug: 'lỗi từ Puter.js (issue #2175)',
        pleaseWait: 'Vui lòng chờ bản fix.',
        duration: 'Thời lượng:',
        size: 'Kích thước:',
        seconds: 'giây',
        horizontal: 'Ngang',
        vertical: 'Dọc',
        testMode: 'Test Mode',
        testModeHint: '(Không tốn credits)',
        describeVideo: 'Mô tả video:',
        videoPlaceholder: 'Mô tả chi tiết video bạn muốn tạo... Ví dụ: A fox sprinting through a snow-covered forest at dusk, cinematic lighting',
        generatingVideo: 'Đang tạo...',
        generateVideo: 'Tạo video',
        videoLoadingText: 'Đang tạo video...',
        videoLoadingSubtext: 'Quá trình này có thể mất 1-5 phút',
        videoPlaceholderText: 'Video được tạo sẽ hiển thị ở đây',
        videoPlaceholderHint: 'Nhập prompt và nhấn "Tạo video"',
        pleaseTryAgain: 'Vui lòng thử lại',

        // Model groups
        other: 'Khác',

        // Footer  
        madeWith: 'Made with 💕 using',

        // Common
        and: 'và',

        // Alpha Modal
        alphaTitle: 'Tính năng Alpha',
        alphaNote: 'Lưu ý:',
        alphaVideoDisabled: 'Tạo video hiện không hoạt động do',
        alphaWaitFix: 'Vui lòng chờ bản fix.',
        alphaVideoAI: 'Tạo video bằng AI',
        alphaInPhase: 'hiện đang trong giai đoạn',
        alphaUnstable: 'Tính năng này RẤT KHÔNG ỔN ĐỊNH',
        alphaManyModelsNotWork: 'Nhiều model có thể không hoạt động',
        alphaTime: 'Thời gian tạo video có thể từ 1-5 phút',
        alphaCredits: 'Một số model yêu cầu credits Puter',
        alphaInDevelopment: 'Đang trong quá trình phát triển',
        alphaTestModeNote: 'Bật Test Mode để thử nghiệm mà không tốn credits.',
        alphaGoBack: 'Quay lại',
        alphaUnderstandContinue: 'Tôi hiểu rủi ro, tiếp tục',
    },
    en: {
        // Header
        appSubtitle: 'AI Chat, Image & Video Generation with Studygram aesthetic',

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

        // Help Modal
        helpTitle: '📚 User Guide',
        helpPurposeTitle: 'Purpose',
        helpPurposeText: 'PaperChat is a completely free AI Chat & Image Generation app, using Puter.js to connect with top AI models like GPT-5.2, Claude, Gemini and more.',
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
        tabImage: 'Image Gen',
        tabVideo: 'Video Gen',

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

        // Image Panel
        imageWarning: 'Image generation may be unstable and consume many credits.',
        note: 'Note:',
        describeEdit: 'Describe edit:',
        describeImage: 'Describe image:',
        editPlaceholder: 'Describe how you want to edit the image... e.g., Add a wizard hat to the character, change background to beach',
        imagePlaceholder: 'Describe the image you want to create in detail... e.g., A cute cat wearing a wizard hat, digital art style, vibrant colors',
        sourceImageLabel: 'Source image (optional - for editing):',
        removeSourceImage: 'Remove source image',
        dropImageHere: 'Drop image here or click to select',
        imageFormats: 'Supports: JPEG, PNG, GIF, WebP (max 5MB)',
        editImage: 'Edit Image',
        generateImage: 'Generate Image',
        generating: 'Generating...',
        imageLoadingText: 'AI is drawing for you...',
        imageLoadingSubtext: 'Please wait a moment!',
        imagePlaceholderText: 'Generated image will appear here',
        imagePlaceholderHint: 'Enter a prompt and click "Generate Image"',

        // Video Panel
        betaVideoWarning: 'This feature is in Beta, may not work and uses A LOT of credits.',
        videoFeaturePaused: 'Feature paused:',
        videoNotWorking: 'Video generation is not working due to',
        puterBug: 'Puter.js bug (issue #2175)',
        pleaseWait: 'Please wait for a fix.',
        duration: 'Duration:',
        size: 'Size:',
        seconds: 'sec',
        horizontal: 'Horizontal',
        vertical: 'Vertical',
        testMode: 'Test Mode',
        testModeHint: '(No credits used)',
        describeVideo: 'Describe video:',
        videoPlaceholder: 'Describe the video you want to create in detail... e.g., A fox sprinting through a snow-covered forest at dusk, cinematic lighting',
        generatingVideo: 'Generating...',
        generateVideo: 'Generate Video',
        videoLoadingText: 'Generating video...',
        videoLoadingSubtext: 'This may take 1-5 minutes',
        videoPlaceholderText: 'Generated video will appear here',
        videoPlaceholderHint: 'Enter a prompt and click "Generate Video"',
        pleaseTryAgain: 'Please try again',

        // Model groups
        other: 'Other',

        // Footer
        madeWith: 'Made with 💕 using',

        // Common
        and: 'and',

        // Alpha Modal
        alphaTitle: 'Alpha Feature',
        alphaNote: 'Note:',
        alphaVideoDisabled: 'Video generation is not working due to',
        alphaWaitFix: 'Please wait for a fix.',
        alphaVideoAI: 'AI Video Generation',
        alphaInPhase: 'is currently in',
        alphaUnstable: 'This feature is VERY UNSTABLE',
        alphaManyModelsNotWork: 'Many models may not work',
        alphaTime: 'Video generation may take 1-5 minutes',
        alphaCredits: 'Some models require Puter credits',
        alphaInDevelopment: 'Currently in development',
        alphaTestModeNote: 'Enable Test Mode to experiment without using credits.',
        alphaGoBack: 'Go Back',
        alphaUnderstandContinue: 'I understand the risks, continue',
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
