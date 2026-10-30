const LAYERS = {
  title: { command: "scene.addCustomScene", priority: 0 },
  captions: { command: "editor.addCaption", priority: 1 },
  images: { command: "editor.addImage", priority: 2 },
  characters: { command: "editor.addImage", priority: 3 },
  background: { command: "editor.addVideo", priority: 4 },
  audio: { command: "editor.addAudio", priority: 5 },
};

export function createLayerInserter(execute) {
  const tracks = new Map();
  return async (role, params) => {
    const layer = LAYERS[role];
    if (!layer) throw new Error(`Unknown dialogue layer: ${role}`);
    const trackId = tracks.get(role);
    const out = await execute(layer.command, {
      ...params, autoReorder: false,
      ...(trackId ? { trackId } : { createNewTrack: true, trackName: `Dialogue ${role}` }),
    });
    const itemId = out?.result?.itemId;
    if (!itemId) throw new Error(`No inserted item receipt for ${role}; inspect timeline before retrying.`);
    const info = await execute("query.getTrackInfo", {});
    const owners = info?.result?.tracks?.filter(track => track.items?.some(item => item.id === itemId)) ?? [];
    if (owners.length !== 1 || trackId && owners[0].id !== trackId) {
      throw new Error(`Inserted ${role} item did not land on its intended track; inspect before retrying.`);
    }
    const actualTrack = owners[0].id;
    if (!trackId) {
      tracks.set(role, actualTrack);
      await execute("editor.editTrack", { trackId: actualTrack, metadata: { priority: layer.priority } });
    }
    return out;
  };
}
