// ============================================================
// Cost Dashboard - Track budget and generation expenses
// ============================================================

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp, DollarSign, Settings } from "lucide-react";

export function CostDashboard() {
  const [showSettings, setShowSettings] = useState(false);
  const [newBudget, setNewBudget] = useState<number | null>(null);

  // Fetch budget status
  const { data: budgetStatus, isLoading: budgetLoading } =
    trpc.costTracking.checkBudgetStatus.useQuery();

  // Fetch monthly summary
  const { data: monthlySummary, isLoading: summaryLoading } =
    trpc.costTracking.getMonthlySummary.useQuery();

  // Fetch budget settings
  const { data: budgetSettings } = trpc.costTracking.getBudgetSettings.useQuery();

  // Update budget mutation
  const updateBudgetMutation = trpc.costTracking.updateBudgetSettings.useMutation({
    onSuccess: () => {
      setShowSettings(false);
      setNewBudget(null);
    },
  });

  if (budgetLoading || summaryLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg animate-pulse" />
        <div className="h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg animate-pulse" />
      </div>
    );
  }

  const percentUsed = budgetStatus?.percentUsed || 0;
  const isWarning = percentUsed > 80;
  const isExceeded = budgetStatus?.isExceeded || false;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-neon-blue" />
          <h2 className="text-2xl font-bold text-white">Cost Tracking</h2>
        </div>
        <Button
          onClick={() => setShowSettings(!showSettings)}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Budget Settings */}
      {showSettings && (
        <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-neon-blue/30">
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Budget Settings</h3>
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                step="10"
                value={newBudget ?? budgetSettings?.monthlyBudget ?? 50}
                onChange={(e) => setNewBudget(parseFloat(e.target.value))}
                className="flex-1 px-3 py-2 bg-black/30 border border-neon-blue/30 rounded text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue"
                placeholder="Monthly budget (USD)"
              />
              <Button
                onClick={() => {
                  if (newBudget !== null) {
                    updateBudgetMutation.mutate({
                      monthlyBudget: newBudget,
                    });
                  }
                }}
                disabled={updateBudgetMutation.isPending}
                className="bg-neon-blue hover:bg-neon-blue/80 text-black font-semibold"
              >
                Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alert if budget exceeded */}
      {isExceeded && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-300">Budget Exceeded</p>
            <p className="text-red-200 text-sm">
              You have exceeded your monthly budget of ${budgetStatus?.monthlyBudget?.toFixed(2)}.
            </p>
          </div>
        </div>
      )}

      {/* Budget Progress */}
      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-neon-blue/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white">Monthly Budget</h3>
            <span className="text-sm text-gray-400">
              {percentUsed.toFixed(1)}% used
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden border border-neon-blue/20">
            <div
              className={`h-full transition-all duration-300 ${
                isExceeded
                  ? "bg-red-500"
                  : isWarning
                    ? "bg-yellow-500"
                    : "bg-neon-blue"
              }`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            />
          </div>

          {/* Budget breakdown */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Used</p>
              <p className="text-xl font-bold text-neon-blue">
                ${budgetStatus?.totalCost?.toFixed(2) || "0.00"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Remaining</p>
              <p
                className={`text-xl font-bold ${
                  isExceeded ? "text-red-400" : "text-neon-green"
                }`}
              >
                ${Math.max(budgetStatus?.remaining || 0, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Limit</p>
              <p className="text-xl font-bold text-gray-300">
                ${budgetStatus?.monthlyBudget?.toFixed(2) || "50.00"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Breakdown by Type */}
      {monthlySummary && (
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-neon-blue/30">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-neon-pink" />
            <h3 className="font-semibold text-white">Cost Breakdown</h3>
          </div>

          <div className="space-y-3">
            {/* Lyrics */}
            <div className="flex items-center justify-between p-3 bg-black/20 rounded border border-neon-blue/10">
              <div>
                <p className="text-white font-medium">Lyrics Generation</p>
                <p className="text-gray-400 text-sm">Cost tracking</p>
              </div>
              <p className="text-neon-blue font-bold">
                ${(monthlySummary.byType?.lyrics || 0).toFixed(4)}
              </p>
            </div>

            {/* Images */}
            <div className="flex items-center justify-between p-3 bg-black/20 rounded border border-neon-blue/10">
              <div>
                <p className="text-white font-medium">Image Generation</p>
                <p className="text-gray-400 text-sm">Cost tracking</p>
              </div>
              <p className="text-neon-pink font-bold">
                ${((monthlySummary.byType as any)?.image || 0).toFixed(4)}
              </p>
            </div>

            {/* Videos */}
            <div className="flex items-center justify-between p-3 bg-black/20 rounded border border-neon-blue/10">
              <div>
                <p className="text-white font-medium">Video Generation</p>
                <p className="text-gray-400 text-sm">Cost tracking</p>
              </div>
              <p className="text-neon-green font-bold">
                ${((monthlySummary.byType as any)?.video || 0).toFixed(4)}
              </p>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4 pt-4 border-t border-neon-blue/20 flex items-center justify-between">
            <p className="text-white font-semibold">Total This Month</p>
            <p className="text-2xl font-bold text-neon-blue">
              ${(monthlySummary.totalCost || 0).toFixed(2)}
            </p>
          </div>
        </Card>
      )}

      {/* Provider Breakdown */}
      {monthlySummary?.byProvider && Object.keys(monthlySummary.byProvider).length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-neon-blue/30">
          <h3 className="font-semibold text-white mb-4">By Provider</h3>
          <div className="space-y-2">
            {Object.entries(monthlySummary.byProvider).map(([provider, cost]) => (
              <div
                key={provider}
                className="flex items-center justify-between p-2 text-sm"
              >
                <span className="text-gray-300 capitalize">{provider}</span>
                <span className="text-neon-blue font-semibold">
                  ${typeof cost === "number" ? cost.toFixed(4) : "0.0000"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {(!monthlySummary || monthlySummary.transactionCount === 0) && (
        <Card className="p-8 text-center bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-neon-blue/30">
          <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No generation costs yet this month</p>
          <p className="text-gray-500 text-sm mt-2">
            Start generating content to see cost tracking here
          </p>
        </Card>
      )}
    </div>
  );
}
