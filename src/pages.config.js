import TagEditor from './pages/TagEditor';
import TagVisualization from './pages/TagVisualization';
import Templates from './pages/Templates';
import History from './pages/History';
import Layout from './Layout.jsx';


export const PAGES = {
    "TagEditor": TagEditor,
    "TagVisualization": TagVisualization,
    "Templates": Templates,
    "History": History,
}

export const pagesConfig = {
    mainPage: "TagEditor",
    Pages: PAGES,
    Layout: Layout,
};