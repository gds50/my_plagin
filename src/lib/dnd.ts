// Shared drag-and-drop contracts for widgets.
//
// Two payload types are supported on the wire (separate dataTransfer MIME types):
//   - BOOKMARK_DND: moving an existing bookmark between BookmarksWidgets.
//   - LINK_DND:     dropping an arbitrary link (TopSites, Recent, etc.) into
//                   a BookmarksWidget. The drop target creates a new bookmark.
//
// Both payloads also set `text/uri-list` and `text/plain`, so dragging out of
// the dashboard (e.g. into the browser tab bar) continues to work as a normal
// link drag.

export const BOOKMARK_DND = 'application/x-mystart-bookmark';
export const LINK_DND = 'application/x-mystart-link';

export interface BookmarkDragPayload {
  wsId: string;
  pageId: string;
  widgetId: string;
  bookmarkId: string;
}

export interface LinkDragPayload {
  url: string;
  title: string;
}

/** Set both our custom MIME and the standard URL MIMEs on the DataTransfer. */
export function setLinkDrag(dt: DataTransfer, payload: LinkDragPayload): void {
  dt.setData(LINK_DND, JSON.stringify(payload));
  dt.setData('text/uri-list', payload.url);
  dt.setData('text/plain', payload.url);
  dt.effectAllowed = 'copyMove';
}

export function setBookmarkDrag(
  dt: DataTransfer,
  bookmark: BookmarkDragPayload & { url: string; title: string },
): void {
  dt.setData(BOOKMARK_DND, JSON.stringify({
    wsId: bookmark.wsId,
    pageId: bookmark.pageId,
    widgetId: bookmark.widgetId,
    bookmarkId: bookmark.bookmarkId,
  } satisfies BookmarkDragPayload));
  dt.setData('text/uri-list', bookmark.url);
  dt.setData('text/plain', bookmark.url);
  dt.effectAllowed = 'move';
}
