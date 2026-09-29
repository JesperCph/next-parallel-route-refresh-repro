// Diagnostic experiment for Next 16.3.5, NOT a production patch.
// This only affects the app's webpack compilation, never node_modules on disk.
module.exports = function rebaseRefreshUrl(source) {
  const replacements = [
    [
      'const navigationSeed = convertServerPatchToFullTree(now, currentFlightRouterState, flightData, renderedSearch, dynamicStaleTime);',
      'const navigationSeed = convertServerPatchToFullTree(now, currentFlightRouterState, flightData, renderedSearch, dynamicStaleTime, canonicalUrl.pathname + canonicalUrl.search);',
    ],
    [
      'function convertServerPatchToFullTree(now, currentTree, flightData, renderedSearch, dynamicStaleTimeSeconds)',
      'function convertServerPatchToFullTree(now, currentTree, flightData, renderedSearch, dynamicStaleTimeSeconds, responseCanonicalUrl)',
    ],
    [
      'convertServerPatchToFullTreeImpl(baseTree, baseData, treePatch, dataPatch, segmentPath, renderedSearch, 0)',
      'convertServerPatchToFullTreeImpl(baseTree, baseData, treePatch, dataPatch, segmentPath, renderedSearch, 0, responseCanonicalUrl)',
    ],
    [
      'function convertServerPatchToFullTreeImpl(baseRouterState, baseData, treePatch, dataPatch, segmentPath, renderedSearch, index)',
      'function convertServerPatchToFullTreeImpl(baseRouterState, baseData, treePatch, dataPatch, segmentPath, renderedSearch, index, responseCanonicalUrl)',
    ],
    ['index + 2);', 'index + 2, responseCanonicalUrl);'],
    ['compressedRefreshState[0],', 'responseCanonicalUrl ?? compressedRefreshState[0],'],
  ];

  for (const [before, after] of replacements) {
    if (source.split(before).length !== 2) {
      throw new Error(`Diagnostic loader: unexpected Next source shape: ${before}`);
    }
    source = source.replace(before, after);
  }
  return source;
};
