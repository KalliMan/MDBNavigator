// The start page's video, recorded by the owner. Put the file in public/start/ (MP4, H.264, at most about 10 MB:
// it ships inside the Docker image), then set src (and poster, a still image, optional). Null: the page shows the
// application screenshot in its place.
export const START_PAGE_VIDEO: { src: string; poster?: string } | null = null;
