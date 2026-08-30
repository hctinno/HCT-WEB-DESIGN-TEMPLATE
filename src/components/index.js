/**
 * HCT 디자인 시스템 — 공개 진입점.
 *
 * 개발 에이전트는 여기서 import 하세요:
 *   import { AppShell, DataGrid, StatusBadge } from '@/components'
 *
 * 이 파일에 없는 것을 직접 만들어야 한다면, 먼저 AGENTS.md 의
 * "새 컴포넌트가 필요할 때" 절차를 확인하세요.
 */

/* 셸 */
export { AppShell, PageContainer, PageHeader } from './shell/AppShell'
export { Sidebar, SidebarGroup, SidebarItem, WorkspaceSwitcher } from './shell/Sidebar'
export { Topbar, Breadcrumb, TopbarIconButton } from './shell/Topbar'
export { RightPanel, PropertyList, PropertyRow, PanelSection } from './shell/RightPanel'

/* 그리드 — 목록의 중심 */
export { DataGrid, BulkActionBar, Checkbox } from './grid/DataGrid'
export { GridCell, CellDisplay, Avatar } from './grid/GridCell'
export { GridCard, GridToolbar, GridPagination } from './grid/GridChrome'

/* 뷰 — 같은 데이터의 여러 투영 */
export { BoardView } from './view/BoardView'
export { ViewTabs, ViewSwitcher, GroupByPicker, SavedViewList, VIEW_TYPES } from './view/ViewBar'

/* 질의 */
export { QueryBar, FilterBuilder } from './query/FilterBuilder'

/* 객체 상세 */
export {
  ObjectDetail, InlineTitle, StatusTransition, ActivityFeed, CommentComposer,
} from './object/ObjectDetail'

/* 대시보드 */
export { StatCard, StatGrid, ChartFrame, LegendItem } from './data/StatCard'

/* 상태 */
export { EmptyState, NoResults, ErrorState } from './state/EmptyState'
export { Skeleton, SkeletonText, SkeletonTable, SkeletonStatCard } from './state/Skeleton'

/* 입력 */
export { Button, IconButton, ButtonGroup } from './input/Button'
export { TextField, SelectField, SearchInput, SearchIcon } from './input/Input'
export { FilterBar, FilterButton, SegmentedControl, DensityToggle } from './input/FilterBar'

/* 피드백 */
export { StatusBadge, Tag, Banner, WORKFLOW_STATUS } from './feedback/StatusBadge'

/* 오버레이 */
export { Modal, ConfirmDialog, Drawer } from './overlay/Modal'
export { CommandPalette, CommandPaletteTrigger } from './overlay/CommandPalette'

/* 데이터 모델 — 화면을 만들기 전에 여기부터 읽으세요 */
export {
  normalizeField, normalizeFields, fieldMap,
  formatValue, formatRelative, formatDate,
  OPERATORS, TYPE_OPERATORS,
} from '../lib/fields'
export {
  emptyQuery, applyQuery, groupRecords, toggleSort,
  queryToText, activeFilterChips, isQueryActive,
  addCondition, updateCondition, removeCondition,
} from '../lib/query'
export { useRecords } from '../lib/useRecords'

/* 유틸 */
export { cn } from '../lib/cn'
export {
  applyTheme, getStoredTheme, initTheme, isDarkActive,
  applyPalette, getStoredPalette, initPalette, PALETTES, DEFAULT_PALETTE,
} from '../lib/theme'
