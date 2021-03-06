import { ProcessingType, ProcessedSpecimenDefinitionName } from '@app/domain/studies';
import { createFeatureSelector, createSelector, MemoizedSelector } from '@ngrx/store';
import * as fromProcessingType from './processing-type.reducer';
import { SearchReply } from '@app/domain/search-reply.model';

export const getSearchActive = (state: fromProcessingType.State): boolean => state.searchActive;

export const getLastSearch =
  (state: fromProcessingType.State): fromProcessingType.LastSearch  => state.lastSearch;

export const getSearchReplies =
  (state: fromProcessingType.State): fromProcessingType.PagedReplyHash => state.searchReplies;

export const getLastAddedId = (state: fromProcessingType.State): string => state.lastAddedId;

export const getLastRemovedId = (state: fromProcessingType.State): string => state.lastRemovedId;

export const getSpecimenDefinitionNames =
  (state: fromProcessingType.State): ProcessedSpecimenDefinitionName[] =>
  state.specimenDefinitionNames;

export const getError =
  (state: fromProcessingType.State): any => state.error;

export const selectProcessingTypeState = createFeatureSelector<fromProcessingType.State>('processing-type');

export const selectSearchActive: MemoizedSelector<object, boolean> =
  createSelector(selectProcessingTypeState, getSearchActive);

export const selectLastSearch: MemoizedSelector<object, fromProcessingType.LastSearch> =
  createSelector(selectProcessingTypeState, getLastSearch);

export const selectSearchReplies: MemoizedSelector<object, fromProcessingType.PagedReplyHash> =
  createSelector(selectProcessingTypeState, getSearchReplies);

export const selectAllProcessingTypes: MemoizedSelector<object, ProcessingType[]> =
  createSelector(selectProcessingTypeState, fromProcessingType.selectAll);

export const selectAllProcessingTypeEntities =
  createSelector(selectProcessingTypeState, fromProcessingType.selectEntities);

export const selectLastAddedId: MemoizedSelector<object, string> =
  createSelector(selectProcessingTypeState, getLastAddedId);

export const selectLastRemovedId: MemoizedSelector<object, string> =
  createSelector(selectProcessingTypeState, getLastRemovedId);

export const selectSpecimenDefinitionNames: MemoizedSelector<object, ProcessedSpecimenDefinitionName[]> =
  createSelector(selectProcessingTypeState, getSpecimenDefinitionNames);

export const selectError: MemoizedSelector<object, any> =
  createSelector(selectProcessingTypeState, getError);

export const selectSearchRepliesAndEntities =
  createSelector(
    selectSearchActive,
    selectLastSearch,
    selectSearchReplies,
    selectAllProcessingTypeEntities,
    (searchActive: boolean,
     lastSearch: fromProcessingType.LastSearch,
     searchReplies: fromProcessingType.PagedReplyHash,
     entities: any): SearchReply<ProcessingType> => {
      if (searchActive || (lastSearch === null)) { return undefined; }

      const reply = searchReplies[lastSearch.studyId][lastSearch.params.queryString()];
      if (reply === undefined) { return undefined; }

      return {
        reply,
        entities: reply.entityIds.map(id => entities[id])
      };
    });

export const selectLastAdded =
  createSelector(
    selectLastAddedId,
    selectAllProcessingTypeEntities,
    (id: string, entities: { [id: string]: ProcessingType }): ProcessingType => {
      return entities[id];
    });
