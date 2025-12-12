/**
 * Image Panel Sub-components
 */

export function ImagePlaceholder() {
  return (
    <div className="image-placeholder">
      <div className="image-placeholder-icon"></div>
      <p className="image-placeholder-text">
        Hình ảnh được tạo sẽ hiển thị ở đây<br />
        <span className="hl-blue">Nhập prompt và nhấn "Tạo hình ảnh"</span>
      </p>
    </div>
  )
}

export function ImageLoading() {
  return (
    <div className="image-loading">
      <div className="image-loading-spinner"></div>
      <p className="image-loading-text">Đang tạo hình ảnh...</p>
      <p className="image-loading-subtext">
        Quá trình này có thể mất 10-30 giây
      </p>
    </div>
  )
}

export function ImageError({ message }) {
  return (
    <div className="image-placeholder">
      <div className="image-placeholder-icon"></div>
      <p className="image-placeholder-text error">
        {message}<br />
        <span className="hl-yellow">Vui lòng thử lại</span>
      </p>
    </div>
  )
}

export function GeneratedImage({ url, prompt }) {
  const shortPrompt = prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt

  return (
    <div className="generated-image-wrapper">
      <div className="polaroid-frame">
        <img className="generated-image" src={url} alt="Generated" />
        <p className="polaroid-caption">"{shortPrompt}"</p>
      </div>
    </div>
  )
}