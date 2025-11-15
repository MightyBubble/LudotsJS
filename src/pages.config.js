import TagEditor from './pages/TagEditor';
import TagSimulator from './pages/TagSimulator';
import UnlockableCommands from './pages/UnlockableCommands';
import InteractionEffects from './pages/InteractionEffects';
import TagEditorV2 from './pages/TagEditorV2';
import TagSimulatorV2 from './pages/TagSimulatorV2';
import UnlockableCommandsV2 from './pages/UnlockableCommandsV2';
import InteractionEffectsV2 from './pages/InteractionEffectsV2';
import Layout from './Layout.jsx';


export const PAGES = {
    "TagEditor": TagEditor,
    "TagSimulator": TagSimulator,
    "UnlockableCommands": UnlockableCommands,
    "InteractionEffects": InteractionEffects,
    "TagEditorV2": TagEditorV2,
    "TagSimulatorV2": TagSimulatorV2,
    "UnlockableCommandsV2": UnlockableCommandsV2,
    "InteractionEffectsV2": InteractionEffectsV2,
}

export const pagesConfig = {
    mainPage: "TagEditor",
    Pages: PAGES,
    Layout: Layout,
};