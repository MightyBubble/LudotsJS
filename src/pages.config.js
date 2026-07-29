/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AttributeEditor from './pages/AttributeEditor';
import AttributeModifiers from './pages/AttributeModifiers';
import AttributeSimulator from './pages/AttributeSimulator';
import ConditionEditor from './pages/ConditionEditor';
import DataGraphEditor from './pages/DataGraphEditor';
import DataTableEditor from './pages/DataTableEditor';
import EntityPrototypeEditor from './pages/EntityPrototypeEditor';
import EntityQueryEditor from './pages/EntityQueryEditor';
import EntityRelationEditor from './pages/EntityRelationEditor';
import GameEventEditor from './pages/GameEventEditor';
import GlobalConstantEditor from './pages/GlobalConstantEditor';
import History from './pages/History';
import Home from './pages/Home';
import InteractionEffects from './pages/InteractionEffects';
import ModifierDefinitionEditor from './pages/ModifierDefinitionEditor';
import NewAttributeSimulator from './pages/NewAttributeSimulator';
import RequirementEditor from './pages/RequirementEditor';
import StructureEditor from './pages/StructureEditor';
import TagEditor from './pages/TagEditor';
import TagSimulator from './pages/TagSimulator';
import TagVisualization from './pages/TagVisualization';
import UnifiedGraphEditor from './pages/UnifiedGraphEditor';
import UnlockableCommands from './pages/UnlockableCommands';
import ValidatorEditor from './pages/ValidatorEditor';
import VisualGraphEditor from './pages/VisualGraphEditor';
import DesignDoc from './pages/DesignDoc';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AttributeEditor": AttributeEditor,
    "AttributeModifiers": AttributeModifiers,
    "AttributeSimulator": AttributeSimulator,
    "ConditionEditor": ConditionEditor,
    "DataGraphEditor": DataGraphEditor,
    "DataTableEditor": DataTableEditor,
    "EntityPrototypeEditor": EntityPrototypeEditor,
    "EntityQueryEditor": EntityQueryEditor,
    "EntityRelationEditor": EntityRelationEditor,
    "GameEventEditor": GameEventEditor,
    "GlobalConstantEditor": GlobalConstantEditor,
    "History": History,
    "Home": Home,
    "InteractionEffects": InteractionEffects,
    "ModifierDefinitionEditor": ModifierDefinitionEditor,
    "NewAttributeSimulator": NewAttributeSimulator,
    "RequirementEditor": RequirementEditor,
    "StructureEditor": StructureEditor,
    "TagEditor": TagEditor,
    "TagSimulator": TagSimulator,
    "TagVisualization": TagVisualization,
    "UnifiedGraphEditor": UnifiedGraphEditor,
    "UnlockableCommands": UnlockableCommands,
    "ValidatorEditor": ValidatorEditor,
    "VisualGraphEditor": VisualGraphEditor,
    "DesignDoc": DesignDoc,
}

export const pagesConfig = {
    mainPage: "TagEditor",
    Pages: PAGES,
    Layout: __Layout,
};