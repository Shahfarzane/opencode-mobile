import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useConfigStore } from '@/stores/useConfigStore';
import { useUIStore } from '@/stores/useUIStore';
import { useDeviceInfo } from '@/lib/device';
import { RiArrowDownSLine, RiArrowRightSLine, RiPencilAiLine, RiStarFill, RiStarLine, RiTimeLine } from '@remixicon/react';
import { cn } from '@/lib/utils';
import { MobileOverlayPanel } from '@/components/ui/MobileOverlayPanel';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { useModelLists } from '@/hooks/useModelLists';

type ProviderModel = Record<string, unknown> & { id?: string; name?: string };

interface ModelSelectorProps {
    providerId: string;
    modelId: string;
    onChange: (providerId: string, modelId: string) => void;
    className?: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
    providerId,
    modelId,
    onChange,
    className
}) => {
    const { providers, modelsMetadata } = useConfigStore();
    const isMobile = useUIStore(state => state.isMobile);
    const { toggleFavoriteModel, isFavoriteModel, addRecentModel } = useUIStore();
    const { favoriteModelsList, recentModelsList } = useModelLists();
    const { isMobile: deviceIsMobile } = useDeviceInfo();
    const isActuallyMobile = isMobile || deviceIsMobile;

    const [isMobilePanelOpen, setIsMobilePanelOpen] = React.useState(false);
    const [expandedMobileProviders, setExpandedMobileProviders] = React.useState<Set<string>>(new Set());

    const closeMobilePanel = () => setIsMobilePanelOpen(false);
    const toggleMobileProviderExpansion = (providerId: string) => {
        setExpandedMobileProviders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(providerId)) {
                newSet.delete(providerId);
            } else {
                newSet.add(providerId);
            }
            return newSet;
        });
    };



    const getModelDisplayName = (model: Record<string, unknown>) => {
        const name = model?.name || model?.id || '';
        const nameStr = String(name);
        if (nameStr.length > 40) {
            return nameStr.substring(0, 37) + '...';
        }
        return nameStr;
    };

    const getModelMetadata = (providerId: string, modelId: string) => {
        const key = `${providerId}/${modelId}`;
        return modelsMetadata.get(key);
    };

    const handleProviderAndModelChange = (newProviderId: string, newModelId: string) => {
        onChange(newProviderId, newModelId);
        // Add to recent models on successful selection
        addRecentModel(newProviderId, newModelId);
    };

    const renderMobileModelPanel = () => {
        if (!isActuallyMobile) return null;

        return (
            <MobileOverlayPanel
                open={isMobilePanelOpen}
                onClose={closeMobilePanel}
                title="Select Model"
            >
                <div className="space-y-1">
                    {/* Favorites Section for Mobile */}
                    {favoriteModelsList.length > 0 && (
                        <div className="rounded-xl border border-border/40 bg-background/95 mb-2">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Favorites
                            </div>
                            <div className="border-t border-border/20">
                                {favoriteModelsList.map(({ model, providerID, modelID }) => {
                                    const isSelectedModel = providerID === providerId && modelID === modelId;
                                    const metadata = getModelMetadata(providerID, modelID);

                                    return (
                                        <div
                                            key={`fav-mobile-${providerID}-${modelID}`}
                                            className={cn(
                                                'flex w-full items-center justify-between px-2 py-1.5 text-left',
                                                'typography-meta',
                                                isSelectedModel ? 'bg-primary/10 text-primary' : 'text-foreground'
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className="flex-1 flex flex-col min-w-0 mr-2"
                                                onClick={() => {
                                                    handleProviderAndModelChange(providerID, modelID);
                                                    closeMobilePanel();
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ProviderLogo
                                                        providerId={providerID}
                                                        className="h-3 w-3 flex-shrink-0"
                                                    />
                                                    <span className="font-medium truncate">{getModelDisplayName(model)}</span>
                                                </div>
                                                {typeof (metadata as unknown as Record<string, unknown>)?.description === 'string' && (
                                                    <span className="typography-micro text-muted-foreground truncate">
                                                        {(metadata as unknown as Record<string, unknown>).description as React.ReactNode}
                                                    </span>
                                                )}
                                            </button>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavoriteModel(providerID, modelID);
                                                }}
                                                className="model-favorite-button flex h-8 w-8 items-center justify-center text-yellow-500 hover:text-yellow-600 active:scale-95 touch-manipulation"
                                                aria-label="Unfavorite"
                                            >
                                                <RiStarFill className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recents Section for Mobile */}
                    {recentModelsList.length > 0 && (
                        <div className="rounded-xl border border-border/40 bg-background/95 mb-2">
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Recents
                            </div>
                            <div className="border-t border-border/20">
                                {recentModelsList.map(({ model, providerID, modelID }) => {
                                    const isSelectedModel = providerID === providerId && modelID === modelId;
                                    const metadata = getModelMetadata(providerID, modelID);

                                    return (
                                        <div
                                            key={`recent-mobile-${providerID}-${modelID}`}
                                            className={cn(
                                                'flex w-full items-center justify-between px-2 py-1.5 text-left',
                                                'typography-meta',
                                                isSelectedModel ? 'bg-primary/10 text-primary' : 'text-foreground'
                                            )}
                                        >
                                            <button
                                                type="button"
                                                className="flex-1 flex flex-col min-w-0 mr-2"
                                                onClick={() => {
                                                    handleProviderAndModelChange(providerID, modelID);
                                                    closeMobilePanel();
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <ProviderLogo
                                                        providerId={providerID}
                                                        className="h-3 w-3 flex-shrink-0"
                                                    />
                                                    <span className="font-medium truncate">{getModelDisplayName(model)}</span>
                                                </div>
                                                {typeof (metadata as unknown as Record<string, unknown>)?.description === 'string' && (
                                                    <span className="typography-micro text-muted-foreground truncate">
                                                        {(metadata as unknown as Record<string, unknown>).description as React.ReactNode}
                                                    </span>
                                                )}
                                            </button>
                                            
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleFavoriteModel(providerID, modelID);
                                                }}
                                                className="model-favorite-button flex h-8 w-8 items-center justify-center text-muted-foreground/50 hover:text-yellow-600 active:scale-95 touch-manipulation"
                                                aria-label="Favorite"
                                            >
                                                <RiStarLine className="h-4 w-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {providers.map((provider) => {
                        const providerModels = Array.isArray(provider.models) ? provider.models : [];
                        if (providerModels.length === 0) return null;

                        const isActiveProvider = provider.id === providerId;
                        const isExpanded = expandedMobileProviders.has(provider.id);

                        return (
                            <div key={provider.id} className="rounded-xl border border-border/40 bg-background/95">
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between gap-1.5 px-2 py-1.5 text-left"
                                    onClick={() => toggleMobileProviderExpansion(provider.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <ProviderLogo
                                            providerId={provider.id}
                                            className="h-3.5 w-3.5"
                                        />
                                        <span className="typography-meta font-medium text-foreground">
                                            {provider.name}
                                        </span>
                                        {isActiveProvider && (
                                            <span className="typography-micro text-primary/80">Current</span>
                                        )}
                                    </div>
                                    {isExpanded ? (
                                        <RiArrowDownSLine className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                        <RiArrowRightSLine className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </button>

                                {isExpanded && (
                                    <div className="border-t border-border/20">
                                        {providerModels.map((modelItem: ProviderModel) => {
                                            const isSelectedModel = provider.id === providerId && modelItem.id === modelId;
                                            const metadata = getModelMetadata(provider.id as string, modelItem.id as string);

                                            return (
                                                <div
                                                    key={modelItem.id as string}
                                                    className={cn(
                                                        'flex w-full items-center justify-between px-2 py-1.5 text-left',
                                                        'typography-meta',
                                                        isSelectedModel ? 'bg-primary/10 text-primary' : 'text-foreground'
                                                    )}
                                                >
                                                    <button
                                                        type="button"
                                                        className="flex-1 flex flex-col min-w-0 mr-2"
                                                        onClick={() => {
                                                            handleProviderAndModelChange(provider.id as string, modelItem.id as string);
                                                            closeMobilePanel();
                                                        }}
                                                    >
                                                        <span className="font-medium truncate">{getModelDisplayName(modelItem)}</span>
                                                        {typeof (metadata as unknown as Record<string, unknown>)?.description === 'string' && (
                                                            <span className="typography-micro text-muted-foreground truncate">
                                                                {(metadata as unknown as Record<string, unknown>).description as React.ReactNode}
                                                            </span>
                                                        )}
                                                    </button>
                                                    
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleFavoriteModel(provider.id as string, modelItem.id as string);
                                                            }}
                                                            className={cn(
                                                                "flex h-8 w-8 items-center justify-center active:scale-95 touch-manipulation",
                                                                isFavoriteModel(provider.id as string, modelItem.id as string)
                                                                    ? "text-yellow-500"
                                                                    : "text-muted-foreground/50"
                                                            )}
                                                            aria-label={isFavoriteModel(provider.id as string, modelItem.id as string) ? "Unfavorite" : "Favorite"}
                                                        >
                                                            {isFavoriteModel(provider.id as string, modelItem.id as string) ? (
                                                                <RiStarFill className="h-4 w-4" />
                                                            ) : (
                                                                <RiStarLine className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                        
                                                        {isSelectedModel && (
                                                            <div className="h-2 w-2 rounded-full bg-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-border/40 bg-background/95 px-2 py-1.5 text-left"
                        onClick={() => {
                            handleProviderAndModelChange('', '');
                            closeMobilePanel();
                        }}
                    >
                        <span className="typography-meta text-muted-foreground">No model (optional)</span>
                    </button>
                </div>
            </MobileOverlayPanel>
        );
    };

    return (
        <>
            {isActuallyMobile ? (
                <button
                    type="button"
                    onClick={() => setIsMobilePanelOpen(true)}
                    className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/95 px-2 py-1.5 text-left',
                        className
                    )}
                >
                    <div className="flex items-center gap-2">
                        {providerId ? (
                            <ProviderLogo
                                providerId={providerId}
                                className="h-3.5 w-3.5"
                            />
                        ) : (
                            <RiPencilAiLine className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="typography-meta font-medium text-foreground">
                            {providerId && modelId ? `${providerId}/${modelId}` : 'Select model...'}
                        </span>
                    </div>
                    <RiArrowDownSLine className="h-3 w-3 text-muted-foreground" />
                </button>
            ) : (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className={cn(
                            'flex items-center gap-2 px-2 rounded-lg bg-accent/20 border border-border/20 cursor-pointer hover:bg-accent/30 h-6 w-fit',
                            className
                        )}>
                            {providerId ? (
                                <>
                                    <ProviderLogo
                                        providerId={providerId}
                                        className="h-3 w-3 flex-shrink-0"
                                    />
                                    <RiPencilAiLine className="h-3 w-3 text-primary/60 hidden" />
                                </>
                            ) : (
                                <RiPencilAiLine className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span className="typography-micro font-medium whitespace-nowrap">
                                {providerId && modelId ? `${providerId}/${modelId}` : 'Not selected'}
                            </span>
                            <RiArrowDownSLine className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="max-w-[300px]">
                        {/* Favorites Section */}
                        {favoriteModelsList.length > 0 && (
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="typography-meta">
                                    <RiStarFill className="h-3 w-3 flex-shrink-0 mr-2 text-yellow-500" />
                                    Favorites
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                    className="max-h-[320px] min-w-[200px]"
                                    sideOffset={2}
                                    collisionPadding={8}
                                    avoidCollisions={true}
                                >
                                    <ScrollableOverlay
                                        outerClassName="max-h-[320px] min-w-[200px]"
                                        className="space-y-1 p-1"
                                    >
                                        {favoriteModelsList.map(({ model, providerID, modelID }) => {
                                            const metadata = getModelMetadata(providerID, modelID);
                                            return (
                                                <DropdownMenuItem
                                                    key={`fav-${providerID}-${modelID}`}
                                                    className="typography-meta"
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        handleProviderAndModelChange(providerID, modelID);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="font-medium truncate">{getModelDisplayName(model)}</span>
                                                            {typeof (metadata as unknown as Record<string, unknown>)?.description === 'string' && (
                                                                <span className="typography-micro text-muted-foreground truncate">
                                                                    {(metadata as unknown as Record<string, unknown>).description as React.ReactNode}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleFavoriteModel(providerID, modelID);
                                                            }}
                                                            className="model-favorite-button flex h-4 w-4 items-center justify-center text-yellow-500 hover:text-yellow-600"
                                                            aria-label="Unfavorite"
                                                        >
                                                            <RiStarFill className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </ScrollableOverlay>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        )}
                        
                        {/* Recents Section */}
                        {recentModelsList.length > 0 && (
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger className="typography-meta">
                                    <RiTimeLine className="h-3 w-3 flex-shrink-0 mr-2 text-muted-foreground" />
                                    Recent
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent
                                    className="max-h-[320px] min-w-[200px]"
                                    sideOffset={2}
                                    collisionPadding={8}
                                    avoidCollisions={true}
                                >
                                    <ScrollableOverlay
                                        outerClassName="max-h-[320px] min-w-[200px]"
                                        className="space-y-1 p-1"
                                    >
                                        {recentModelsList.map(({ model, providerID, modelID }) => {
                                            const metadata = getModelMetadata(providerID, modelID);
                                            return (
                                                <DropdownMenuItem
                                                    key={`recent-${providerID}-${modelID}`}
                                                    className="typography-meta"
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        handleProviderAndModelChange(providerID, modelID);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="font-medium truncate">{getModelDisplayName(model)}</span>
                                                            {typeof (metadata as unknown as Record<string, unknown>)?.description === 'string' && (
                                                                <span className="typography-micro text-muted-foreground truncate">
                                                                    {(metadata as unknown as Record<string, unknown>).description as React.ReactNode}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleFavoriteModel(providerID, modelID);
                                                            }}
                                                            className="model-favorite-button flex h-4 w-4 items-center justify-center text-muted-foreground hover:text-yellow-600"
                                                            aria-label="Favorite"
                                                        >
                                                            <RiStarLine className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                    </ScrollableOverlay>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>
                        )}
                        
                        {/* Separator before providers */}
                        {(favoriteModelsList.length > 0 || recentModelsList.length > 0) && (
                            <DropdownMenuSeparator />
                        )}

                        {providers.map((provider) => {
                            const providerModels = Array.isArray(provider.models) ? provider.models : [];

                            if (providerModels.length === 0) {
                                return (
                                    <DropdownMenuItem
                                        key={provider.id}
                                        disabled
                                        className="typography-meta text-muted-foreground"
                                    >
                                        <ProviderLogo
                                            providerId={provider.id}
                                            className="h-3 w-3 flex-shrink-0 mr-2"
                                        />
                                        {provider.name} (No models)
                                    </DropdownMenuItem>
                                );
                            }

                            return (
                                <DropdownMenuSub key={provider.id}>
                                    <DropdownMenuSubTrigger className="typography-meta">
                                        <ProviderLogo
                                            providerId={provider.id}
                                            className="h-3 w-3 flex-shrink-0 mr-2"
                                        />
                                        {provider.name}
                                    </DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent
                                        className="max-h-[320px] min-w-[200px]"
                                        sideOffset={2}
                                        collisionPadding={8}
                                        avoidCollisions={true}
                                    >
                                        <ScrollableOverlay
                                            outerClassName="max-h-[320px] min-w-[200px]"
                                            className="space-y-1 p-1"
                                        >
                                            {providerModels.map((modelItem: ProviderModel) => {
                                                    const metadata = getModelMetadata(provider.id as string, modelItem.id as string);

                                            return (
                                                <DropdownMenuItem
                                                    key={modelItem.id as string}
                                                    className="typography-meta"
                                                    onSelect={(e) => {
                                                        e.preventDefault();
                                                        handleProviderAndModelChange(provider.id as string, modelItem.id as string);
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="flex flex-col flex-1 min-w-0">
                                                            <span className="font-medium truncate">{getModelDisplayName(modelItem)}</span>
                                                            {typeof (metadata as unknown as Record<string, unknown>)?.description === 'string' && (
                                                                <span className="typography-micro text-muted-foreground truncate">
                                                                    {(metadata as unknown as Record<string, unknown>).description as React.ReactNode}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleFavoriteModel(provider.id as string, modelItem.id as string);
                                                            }}
                                                            className={cn(
                                                                "flex h-4 w-4 items-center justify-center hover:text-yellow-600",
                                                                isFavoriteModel(provider.id as string, modelItem.id as string)
                                                                    ? "text-yellow-500"
                                                                    : "text-muted-foreground"
                                                            )}
                                                            aria-label={isFavoriteModel(provider.id as string, modelItem.id as string) ? "Unfavorite" : "Favorite"}
                                                        >
                                                            {isFavoriteModel(provider.id as string, modelItem.id as string) ? (
                                                                <RiStarFill className="h-3.5 w-3.5" />
                                                            ) : (
                                                                <RiStarLine className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                </DropdownMenuItem>
                                            );
                                        })}
                                        </ScrollableOverlay>
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                            );
                        })}
                        <DropdownMenuItem
                            className="typography-meta"
                            onSelect={() => handleProviderAndModelChange('', '')}
                        >
                            <span className="text-muted-foreground">No model (optional)</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
            {renderMobileModelPanel()}
        </>
    );
};
