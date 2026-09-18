// api/src/modules/meditations/meditation.controller.js
import { meditationService } from "./meditation.service.js";
import { assertUploadedAudioAccess, isPrivateAudio, localAudioFilename, localAudioPath } from "./meditation.audio.js";

function protectAudioUrl(result) {
  if (result.meditation?.audioUrl && (result.meditation.isPremium || isPrivateAudio(result.meditation.audioUrl))) {
    result.meditation.audioUrl = `/meditations/${encodeURIComponent(result.meditation.slug)}/audio`;
  }
  return result;
}

export const meditationController = {
  async daily(req, res) {
    const result = await meditationService.daily(req.user?.id);
    return res.set("Cache-Control", "private, no-store").json(protectAudioUrl(result));
  },

  async detail(req, res) {
    const result = await meditationService.detail(req.params.slug, req.user?.id);
    return res.set("Cache-Control", "private, no-store").json(protectAudioUrl(result));
  },

  async audio(req, res, next) {
    const { meditation } = await meditationService.detail(req.params.slug, req.user?.id);
    const filename = localAudioFilename(meditation.audioUrl);
    if (!filename) return res.sendStatus(404);
    await assertUploadedAudioAccess(filename, req.user?.id);
    res.set("Cache-Control", "private, no-store");
    res.sendFile(localAudioPath(meditation.audioUrl), { cacheControl: false }, error => { if (error) next(error); });
  },

  // ✅ NEW
  async standaloneList(req, res) {
    const { limit, cursorId, cursorCreatedAt } = req.query;

    const result = await meditationService.standaloneList({
      limit,
      cursorId,
      cursorCreatedAt,
    });

    return res.set("Cache-Control", "private, no-store").json(result);
  },
};
