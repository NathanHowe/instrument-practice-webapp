export function getCachedThumbnail(songId) {
    return localStorage.getItem(`thumbnail_${songId}`);
}

export function saveThumbnail(songId, dataUrl) {
    localStorage.setItem(`thumbnail_${songId}`, dataUrl);
}