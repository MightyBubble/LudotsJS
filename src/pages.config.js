import TagEditor from './pages/TagEditor';
import TagSimulator from './pages/TagSimulator';
import Layout from './Layout.jsx';


export const PAGES = {
    "TagEditor": TagEditor,
    "TagSimulator": TagSimulator,
}

export const pagesConfig = {
    mainPage: "TagEditor",
    Pages: PAGES,
    Layout: Layout,
};