import React, { useState } from 'react';
import { PickingTask, PickerLeaderboardEntry } from '../../types/warehouse';
import { PriorityBadge } from '../common/StatusBadge';
import {
  Footprints,
  MapPin,
  CheckCircle2,
  Navigation,
  Trophy,
  Clock,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';

interface Props {
  tasks: PickingTask[];
  leaderboard: PickerLeaderboardEntry[];
  onCompleteTask: (taskId: string) => Promise<any>;
}

export const PickingView: React.FC<Props> = ({
  tasks = [],
  leaderboard = [],
  onCompleteTask
}) => {
  const safeTasks = tasks || [];
  const safeLeaderboard = leaderboard || [];
  const [selectedTask, setSelectedTask] = useState<PickingTask | undefined>(safeTasks[0]);
  const [isCompleting, setIsCompleting] = useState(false);

  // Sync selectedTask if tasks change and nothing is selected
  React.useEffect(() => {
    if (!selectedTask && safeTasks.length > 0) {
      setSelectedTask(safeTasks[0]);
    }
  }, [safeTasks, selectedTask]);

  const handleComplete = async (taskId: string) => {
    setIsCompleting(true);
    try {
      await onCompleteTask(taskId);
      const updated = safeTasks.find(t => t.id === taskId);
      if (updated) setSelectedTask(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompleting(false);
    }
  };

  // Warehouse Grid Dimensions
  const aisles = ['A', 'B', 'C', 'D'];
  const bays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const currentRouteLocations = selectedTask?.route?.sequence?.map(s => s.location) || [];

  return (
    <div id="view-picking-management" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Intelligent Wave Picking
            </span>
            <span className="text-xs text-slate-400">S-Shape Path Optimization Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Picking Operations & Route Visualizer</h1>
          <p className="text-xs text-slate-500">
            Calculates optimal walking sequence across aisles and bays to minimize travel distance and picker fatigue.
          </p>
        </div>
      </div>

      {/* Main Grid: Active Task & 2D Warehouse Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive 2D Warehouse Grid Map */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">2D Warehouse Layout</span>
              <h2 className="text-lg font-bold text-slate-900">
                Visual Pick Route: {selectedTask?.taskNumber || 'Pick Wave 01'}
              </h2>
            </div>
            {selectedTask?.route && (
              <div className="flex items-center gap-3 text-xs">
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold">
                  ⚡ Saves {selectedTask.route.estimatedTimeMinutes} min ({selectedTask.route.totalDistanceMeters}m walk)
                </span>
              </div>
            )}
          </div>

          {/* 2D Map Canvas Representation */}
          <div className="bg-slate-950 rounded-2xl p-6 text-white relative overflow-hidden border border-slate-800 shadow-inner">
            {/* Top Drop-off area */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-200">PACKING CONVEYOR INFEED (Drop-off Point)</span>
              </div>
              <span className="font-mono text-[11px] text-slate-500">Zone 01 · 4 Aisles · 40 Storage Bays</span>
            </div>

            {/* Warehouse Aisles & Bays Grid */}
            <div className="py-6 space-y-6">
              {aisles.map(aisle => (
                <div key={aisle} className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 font-mono">
                    <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-200">AISLE {aisle}</span>
                    <span className="text-[10px] text-slate-500">Heavy Rack Storage</span>
                  </div>

                  <div className="grid grid-cols-10 gap-1.5">
                    {bays.map(bay => {
                      const locStr = `${aisle}-${String(bay).padStart(2, '0')}`;
                      const isWaypoint = currentRouteLocations.includes(locStr);
                      const waypointIdx = currentRouteLocations.indexOf(locStr);

                      return (
                        <div
                          key={locStr}
                          className={`h-12 rounded-lg border text-[10px] font-mono flex flex-col items-center justify-center transition-all ${
                            isWaypoint
                              ? 'bg-gradient-to-br from-indigo-600 to-purple-600 border-indigo-400 text-white font-bold shadow-lg shadow-indigo-500/30 scale-105 z-10'
                              : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <span>{locStr}</span>
                          {isWaypoint && (
                            <span className="text-[9px] bg-white text-indigo-950 px-1 rounded font-extrabold mt-0.5">
                              STOP #{waypointIdx + 1}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Path description legend */}
            <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span>Optimal Waypoint</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-slate-800" />
                  <span>Standard Bin</span>
                </div>
              </div>
              <div className="font-mono text-[11px] text-slate-400">
                Algorithm: S-Shape Continuous Sweep
              </div>
            </div>
          </div>

          {/* Sequential Waypoints List */}
          {selectedTask?.route?.sequence && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                Sequential Pick Execution Sequence
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {(selectedTask.route.sequence || []).map((step, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {sIdx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{step.location}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[120px]">{step.productName}</div>
                      </div>
                    </div>
                    <span className="font-bold text-slate-800">{step.quantity} pcs</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Active Tasks & Picker Leaderboard */}
        <div className="lg:col-span-4 space-y-6">
          {/* Active Pick Waves */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pick Dispatch</span>
                <h2 className="text-lg font-bold text-slate-900">Active Pick Tasks</h2>
              </div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {safeTasks.filter(t => t.status === 'IN_PROGRESS').length} Active
              </span>
            </div>

            <div className="space-y-3">
              {safeTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    selectedTask?.id === task.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs">{task.taskNumber}</div>
                      <div className={`text-[11px] ${selectedTask?.id === task.id ? 'text-slate-300' : 'text-slate-500'}`}>
                        Order: {task.orderNumber} · Picker: {task.pickerName}
                      </div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={selectedTask?.id === task.id ? 'text-slate-300' : 'text-slate-500'}>
                      Progress: <strong>{task.pickedItemsCount} / {task.totalItemsCount} items</strong>
                    </span>
                    <span className={`text-[11px] font-bold ${task.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {task.status}
                    </span>
                  </div>

                  {task.status !== 'COMPLETED' && selectedTask?.id === task.id && (
                    <button
                      id={`btn-complete-pick-${task.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(task.id);
                      }}
                      disabled={isCompleting}
                      className="w-full mt-2 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleting ? 'Completing...' : 'Mark Wave Pick Complete'}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Picker Productivity Leaderboard */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold text-slate-900">Picker Leaderboard</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">Today's Shift</span>
            </div>

            <div className="space-y-2.5">
              {safeLeaderboard.map((picker, idx) => (
                <div
                  key={picker.pickerId}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{picker.name}</div>
                      <div className="text-[10px] text-slate-500">{picker.completedPicks} picks · {picker.accuracyRate}% acc</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{picker.picksPerHour}</span>
                    <span className="text-[10px] text-slate-500 block">picks/hr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
