'use client';

import { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  Panel,
  NodeTypes,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { WpsScript, WpsSection, WpsBlock } from '@/lib/wps/types';
import { blockLabel } from '@/lib/wps/schema';

type WpsWorkflowViewProps = {
  script: WpsScript;
};

// Custom node types
type WpsNodeData = {
  label: string;
  type: 'section' | 'action' | 'condition';
  paramCount?: number;
};

// Custom Section Node Component
function SectionNode({ data }: { data: WpsNodeData }) {
  return (
    <div className="px-4 py-3 min-w-[200px] rounded-xl border-2 border-purple-500/50 bg-purple-500/20 shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3" />
      <div className="text-sm font-semibold text-purple-200 text-center line-clamp-2 break-words">
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-3 !h-3" />
    </div>
  );
}

// Custom Action Node Component
function ActionNode({ data }: { data: WpsNodeData }) {
  return (
    <div className="px-4 py-3 min-w-[160px] rounded-lg border-2 border-emerald-500/50 bg-emerald-500/20 shadow-lg">
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3" />
      <div className="text-xs font-semibold text-emerald-200 text-center line-clamp-2 break-words">
        {data.label}
      </div>
      {data.paramCount !== undefined && data.paramCount > 0 && (
        <div className="mt-1 text-center text-[9px] text-white/40">{data.paramCount}p</div>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
    </div>
  );
}

// Custom Condition Node Component (Diamond Shape)
function ConditionNode({ data }: { data: WpsNodeData }) {
  const size = 100;
  const halfSize = size / 2;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3" />
      <svg width={size} height={size} className="absolute inset-0">
        <polygon
          points={`${halfSize},0 ${size},${halfSize} ${halfSize},${size} 0,${halfSize}`}
          fill="#f59e0b50"
          stroke="#f59e0b"
          strokeWidth="2.5"
          className="transition hover:opacity-80"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-2 pointer-events-none">
        <div className="text-[11px] font-semibold text-amber-200 text-center line-clamp-2 break-words">
          {data.label}
        </div>
        {data.paramCount !== undefined && data.paramCount > 0 && (
          <div className="mt-1 text-[9px] text-white/40">{data.paramCount}p</div>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-amber-500 !w-3 !h-3" />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  section: SectionNode,
  action: ActionNode,
  condition: ConditionNode,
};

export function WpsWorkflowView({ script }: WpsWorkflowViewProps) {
  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node<WpsNodeData>[] = [];
    const flowEdges: Edge[] = [];
    let nodeIdCounter = 0;

    // Track sequential blocks for proper connections
    type BlockInfo = {
      nodeId: string;
      block: WpsBlock;
      parentId: string | null;
      isSequential: boolean; // true if this is a sequential sibling, false if nested
    };

    function createBlockNode(
      block: WpsBlock,
      parentId: string | null,
      isSequential: boolean
    ): BlockInfo {
      const nodeId = `block-${nodeIdCounter++}`;
      const paramCount = Object.keys(block.params).length;
      
      const blockNode: Node<WpsNodeData> = {
        id: nodeId,
        type: block.type,
        data: {
          label: blockLabel(block.name),
          type: block.type,
          paramCount,
        },
        position: { x: 0, y: 0 }, // Will be calculated by layout
      };

      flowNodes.push(blockNode);

      return {
        nodeId,
        block,
        parentId,
        isSequential,
      };
    }

    // Process sections and their blocks
    script.sections.forEach((section, sectionIdx) => {
      const sectionLabel =
        section.type === 'gameStage' ? `Stage ${section.stageNumber}` : 'Game Failed';
      const sectionId = `section-${sectionIdx}`;

      const sectionNode: Node<WpsNodeData> = {
        id: sectionId,
        type: 'section',
        data: {
          label: sectionLabel,
          type: 'section',
        },
        position: { x: 0, y: 0 },
      };

      flowNodes.push(sectionNode);

      // Process top-level blocks sequentially
      const topLevelBlocks: BlockInfo[] = [];
      section.body.forEach((block) => {
        topLevelBlocks.push(createBlockNode(block, sectionId, true));
      });

      // Create edges for sequential flow: section -> first block, then block -> next block
      if (topLevelBlocks.length > 0) {
        // Connect section to first block
        flowEdges.push({
          id: `${sectionId}-${topLevelBlocks[0].nodeId}`,
          source: sectionId,
          target: topLevelBlocks[0].nodeId,
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#ffffff60', strokeWidth: 2 },
        });

        // Connect sequential blocks (action1 -> action2 -> action3)
        for (let i = 0; i < topLevelBlocks.length - 1; i++) {
          flowEdges.push({
            id: `${topLevelBlocks[i].nodeId}-${topLevelBlocks[i + 1].nodeId}`,
            source: topLevelBlocks[i].nodeId,
            target: topLevelBlocks[i + 1].nodeId,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#ffffff60', strokeWidth: 2 },
          });
        }

        // Process nested blocks (conditions inside actions)
        function processNestedBlocks(blockInfo: BlockInfo) {
          if (blockInfo.block.body.length > 0) {
            blockInfo.block.body.forEach((childBlock) => {
              const childInfo = createBlockNode(childBlock, blockInfo.nodeId, false);
              
              // Connect parent to nested child
              flowEdges.push({
                id: `${blockInfo.nodeId}-${childInfo.nodeId}`,
                source: blockInfo.nodeId,
                target: childInfo.nodeId,
                type: 'smoothstep',
                animated: false,
                style: { stroke: '#ffffff40', strokeWidth: 1.5 },
              });

              // Process deeper nesting
              processNestedBlocks(childInfo);
            });
          }
        }

        topLevelBlocks.forEach(processNestedBlocks);
      }
    });

    // Layout algorithm: clean hierarchical tree
    const nodeMap = new Map<string, Node>();
    flowNodes.forEach((node) => nodeMap.set(node.id, { ...node }));

    // Build edge relationships
    const outgoingEdges = new Map<string, string[]>(); // source -> targets
    const incomingEdges = new Map<string, string[]>(); // target -> sources
    
    flowEdges.forEach((edge) => {
      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, []);
      }
      outgoingEdges.get(edge.source)!.push(edge.target);

      if (!incomingEdges.has(edge.target)) {
        incomingEdges.set(edge.target, []);
      }
      incomingEdges.get(edge.target)!.push(edge.source);
    });

    // Layout sections vertically
    const sectionNodes = flowNodes.filter((node) => node.type === 'section');
    let currentY = 100;
    const sectionSpacing = 500;
    const nodeSpacingY = 100;
    const nestedIndentX = 220;

    sectionNodes.forEach((sectionNode) => {
      sectionNode.position = { x: 200, y: currentY };
      nodeMap.set(sectionNode.id, sectionNode);

      // Get all direct children of section (top-level blocks) - these are sequential
      const topLevelChildren = outgoingEdges.get(sectionNode.id) || [];
      if (topLevelChildren.length === 0) {
        currentY += 200;
        return;
      }

      // Layout top-level blocks sequentially (they flow downward)
      let blockY = currentY + 120;
      const visited = new Set<string>();

      function layoutNode(nodeId: string, level: number, startY: number): number {
        if (visited.has(nodeId)) return startY;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (!node) return startY;

        const x = 200 + level * nestedIndentX;
        node.position = { x, y: startY };
        nodeMap.set(nodeId, node);

        // Get nested children (conditions/actions inside this block's body)
        const nestedChildren = outgoingEdges.get(nodeId) || [];
        
        let nextY = startY + nodeSpacingY;

        // Layout nested children (indented to the right)
        nestedChildren.forEach((nestedId) => {
          if (!visited.has(nestedId)) {
            nextY = layoutNode(nestedId, level + 1, nextY);
          }
        });

        return nextY;
      }

      // Layout each top-level block sequentially
      topLevelChildren.forEach((childId) => {
        blockY = layoutNode(childId, 0, blockY);
      });

      currentY = blockY + sectionSpacing;
    });

    return {
      nodes: Array.from(nodeMap.values()),
      edges: flowEdges,
    };
  }, [script]);

  function FitViewButton() {
    const { fitView } = useReactFlow();
    return (
      <button
        onClick={() => fitView({ padding: 0.2, duration: 300 })}
        className="rounded-lg border border-white/20 bg-black/60 px-3 py-1.5 text-xs text-white hover:bg-white/10"
      >
        Fit to View
      </button>
    );
  }

  return (
    <div className="relative h-[calc(100vh-300px)] w-full rounded-xl border border-white/10 bg-black/20">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: false,
          style: { stroke: '#ffffff50', strokeWidth: 2 },
        }}
        className="bg-transparent"
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background color="#ffffff10" gap={20} />
        <Controls className="bg-black/60 border-white/20" />
        <MiniMap
          className="bg-black/60 border-white/20"
          nodeColor={(node) => {
            if (node.type === 'section') return '#a855f7';
            if (node.type === 'condition') return '#f59e0b';
            return '#10b981';
          }}
        />
        <Panel position="top-right" className="flex flex-col gap-2">
          <FitViewButton />
        </Panel>
      </ReactFlow>
    </div>
  );
}
