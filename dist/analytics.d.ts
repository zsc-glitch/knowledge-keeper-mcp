/**
 * Knowledge Analytics Module
 * Insights, patterns, and statistics about your knowledge base
 * Free tier: basic stats | Pro tier: advanced analytics
 */
export interface AnalyticsOverview {
    totalItems: number;
    totalTags: number;
    totalLinks: number;
    typesBreakdown: Record<string, number>;
    topTags: Array<{
        tag: string;
        count: number;
    }>;
    recentActivity: Array<{
        id: string;
        title: string;
        action: string;
        date: string;
    }>;
    oldestItem: string | null;
    newestItem: string | null;
    averageContentLength: number;
    knowledgeHealth: number;
}
export interface AnalyticsInsights {
    orphanItems: number;
    untaggedItems: number;
    unlinkedItems: number;
    duplicateCandidates: number;
    staleItems: number;
    reviewOverdue: number;
    connectivityScore: number;
    coverageScore: number;
    freshnessScore: number;
}
export interface AnalyticsTimeline {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
}
export declare function getAnalyticsOverview(vaultPath: string): Promise<AnalyticsOverview>;
export declare function getAnalyticsInsights(vaultPath: string): Promise<AnalyticsInsights>;
export declare function getAnalyticsTimeline(vaultPath: string): Promise<AnalyticsTimeline>;
