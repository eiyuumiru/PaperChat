import { useState, useCallback } from "react";
import { MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from "../utils/constants";

function validateImageFile(file) {
  if (!file) return { valid: false, error: "Không có file được chọn" };
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error:
        "Định dạng ảnh không được hỗ trợ. Chỉ hỗ trợ JPEG, PNG, GIF, WebP.",
    };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: "Ảnh quá lớn. Kích thước tối đa là 5MB." };
  }
  return { valid: true };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function useImageGeneration() {
  const [imageUrl, setImageUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastPrompt, setLastPrompt] = useState("");

  const extractImageUrl = (response) => {
    if (response instanceof HTMLImageElement) return response.src;
    if (response?.tagName === "IMG" && response?.src) return response.src;
    if (response?.src) return response.src;
    if (response?.url) return response.url;
    if (response?.image) return response.image;
    if (
      typeof response === "string" &&
      (response.startsWith("http") || response.startsWith("data:"))
    )
      return response;
    if (response?.data) return response.data;
    return null;
  };

  const generateImage = useCallback(
    async (prompt, model) => {
      if (!prompt.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);
      setLastPrompt(prompt.trim());

      try {
        const isTogetherModel = model.includes("/");
        const response = await window.puter.ai.txt2img(prompt.trim(), {
          model,
          ...(isTogetherModel && { provider: "together" }),
        });

        if (response?.success === false) {
          throw { error: response.error || {} };
        }

        const url = extractImageUrl(response);
        if (url) {
          setImageUrl(url);
        } else {
          throw new Error("Model không trả về hình ảnh.");
        }
      } catch (err) {
        let errorCode = "",
          errorStatus = 0,
          errorMessage = "";
        for (let key in err) {
          if (err[key]?.code) errorCode = err[key].code;
          if (err[key]?.status) errorStatus = err[key].status;
          if (err[key]?.message) errorMessage = err[key].message;
        }
        if (!errorCode) errorCode = err.code;
        if (!errorStatus) errorStatus = err.status;
        if (!errorMessage) errorMessage = err.message;

        let displayMsg = "Không thể tạo hình ảnh";
        if (errorCode === "insufficient_funds" || errorStatus === 402) {
          displayMsg =
            "Hết credits API. Vui lòng nạp thêm tại puter.com để tiếp tục sử dụng.";
        } else if (errorCode === "rate_limit_exceeded" || errorStatus === 429) {
          displayMsg = "Quá nhiều yêu cầu. Vui lòng đợi một chút.";
        } else if (errorStatus === 451) {
          displayMsg = `Model "${model}" bị chặn. Thử model khác.`;
        } else if (errorStatus === 503) {
          displayMsg = "Model đang bận. Thử lại sau.";
        } else if (errorMessage) {
          displayMsg = errorMessage;
        }

        setError(displayMsg);
        setImageUrl(null);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const editImage = useCallback(
    async (prompt, imageFile, model) => {
      if (!prompt.trim() || isLoading) return;

      const validation = validateImageFile(imageFile);
      if (!validation.valid) {
        setError(validation.error);
        return;
      }

      setIsLoading(true);
      setError(null);
      setLastPrompt(prompt.trim());

      try {
        const isGeminiModel = model.includes("gemini");
        let response;

        if (isGeminiModel) {
          const base64Data = await fileToBase64(imageFile);
          const mimeType = imageFile.type || "image/png";
          response = await window.puter.ai.txt2img(prompt.trim(), {
            model,
            input_image: base64Data,
            input_image_mime_type: mimeType,
          });
        } else {
          const fileName = `edit_image_${Date.now()}.${imageFile.name.split(".").pop() || "png"}`;
          const puterFile = await window.puter.fs.write(fileName, imageFile);

          try {
            const analysisResponse = await window.puter.ai.chat(
              [
                {
                  role: "user",
                  content: [
                    { type: "file", puter_path: puterFile.path },
                    {
                      type: "text",
                      text: `Analyze this image and create a detailed prompt for regenerating it with these modifications: "${prompt}". Output ONLY the prompt.`,
                    },
                  ],
                },
              ],
              { model: "gpt-5-nano" },
            );

            let enhancedPrompt = prompt;
            if (analysisResponse?.message?.content) {
              enhancedPrompt = analysisResponse.message.content;
            } else if (typeof analysisResponse === "string") {
              enhancedPrompt = analysisResponse;
            }

            const isTogetherModel = model.includes("/");
            response = await window.puter.ai.txt2img(enhancedPrompt, {
              model,
              ...(isTogetherModel && { provider: "together" }),
            });
          } finally {
            try {
              await window.puter.fs.delete(puterFile.path);
            } catch {}
          }
        }

        const url = extractImageUrl(response);
        if (url) {
          setImageUrl(url);
        } else {
          throw new Error(
            "Model không trả về hình ảnh. Vui lòng thử lại hoặc dùng model khác.",
          );
        }
      } catch (err) {
        setError(err.message || "Không thể chỉnh sửa hình ảnh");
        setImageUrl(null);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  const resetImage = useCallback(() => {
    setImageUrl(null);
    setError(null);
    setLastPrompt("");
  }, []);

  return {
    imageUrl,
    isLoading,
    error,
    lastPrompt,
    generateImage,
    editImage,
    resetImage,
    setError,
  };
}
