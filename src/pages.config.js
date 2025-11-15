import TagEditor from './pages/TagEditor';
import TagSimulator from './pages/TagSimulator';
import UnlockableCommands from './pages/UnlockableCommands';
import InteractionEffects from './pages/InteractionEffects';
import AttributeModifiers from './pages/AttributeModifiers';
import AttributeSimulator from './pages/AttributeSimulator';
import Layout from './Layout.jsx';


export const PAGES = {
    "TagEditor": TagEditor,
    "TagSimulator": TagSimulator,
    "UnlockableCommands": UnlockableCommands,
    "InteractionEffects": InteractionEffects,
    "AttributeModifiers": AttributeModifiers,
    "AttributeSimulator": AttributeSimulator,
}

export const pagesConfig = {
    mainPage: "TagEditor",
    Pages: PAGES,
    Layout: Layout,
};