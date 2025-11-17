import React from 'react';
import Node from './Node';
import QueryNode from '../queryGraph/QueryNode';
import DataTableNode from './DataTableNode';

const queryNodeTypes = [
  'entity_source', 'filter_prototype', 'filter_attribute', 'filter_tag', 'filter_relation', 
  'filter_relation_attribute', 'filter_relation_tag', 'filter_related_entity_attribute', 
  'filter_related_entity_tag', 'spatial_distance', 'spatial_area', 'logic_intersect', 
  'logic_union', 'logic_difference', 'sort_by_attribute', 'sort_by_relation', 'sort_by_tag',
  'limit_top', 'limit_bottom', 'limit_percent_top', 'limit_percent_bottom', 'output'
];

export default function UnifiedNode(props) {
  if (props.node.type === 'data_table_read') {
    return <DataTableNode {...props} />;
  }
  if (queryNodeTypes.includes(props.node.type)) {
    return <QueryNode {...props} />;
  }
  return <Node {...props} />;
}