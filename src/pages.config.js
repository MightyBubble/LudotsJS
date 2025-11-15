import TagEditor from './pages/TagEditor';
import TagSimulator from './pages/TagSimulator';
import UnlockableCommands from './pages/UnlockableCommands';
import InteractionEffects from './pages/InteractionEffects';
import AttributeModifiers from './pages/AttributeModifiers';
import AttributeSimulator from './pages/AttributeSimulator';
import AttributeEditor from './pages/AttributeEditor';
import ModifierDefinitionEditor from './pages/ModifierDefinitionEditor';
import NewAttributeSimulator from './pages/NewAttributeSimulator';
import DataGraphEditor from './pages/DataGraphEditor';
import VisualGraphEditor from './pages/VisualGraphEditor';
import EntityPrototypeEditor from './pages/EntityPrototypeEditor';
import EntityRelationEditor from './pages/EntityRelationEditor';
import EntityQueryEditor from './pages/EntityQueryEditor';
import Layout from './Layout.jsx';


export const PAGES = {
    "TagEditor": TagEditor,
    "TagSimulator": TagSimulator,
    "UnlockableCommands": UnlockableCommands,
    "InteractionEffects": InteractionEffects,
    "AttributeModifiers": AttributeModifiers,
    "AttributeSimulator": AttributeSimulator,
    "AttributeEditor": AttributeEditor,
    "ModifierDefinitionEditor": ModifierDefinitionEditor,
    "NewAttributeSimulator": NewAttributeSimulator,
    "DataGraphEditor": DataGraphEditor,
    "VisualGraphEditor": VisualGraphEditor,
    "EntityPrototypeEditor": EntityPrototypeEditor,
    "EntityRelationEditor": EntityRelationEditor,
    "EntityQueryEditor": EntityQueryEditor,
}

export const pagesConfig = {
    mainPage: "TagEditor",
    Pages: PAGES,
    Layout: Layout,
};