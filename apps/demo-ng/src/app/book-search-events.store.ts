import { inject } from '@angular/core';
import { signalStore, withState, type } from '@ngrx/signals';
import { event, eventGroup, Events, on, withEventHandlers, withReducer } from '@ngrx/signals/events';
import { catchError, debounceTime, filter, from, map, of, switchMap } from 'rxjs';
import { withStellarDevtools } from '@hypertheory-labs/stellar-ng-devtools';

export interface BookResult {
  title: string;
  author: string;
  year: number | null;
}

export interface BookSearchState {
  query: string;
  results: BookResult[];
  loading: boolean;
  error: string | null;
}

// Page events — dispatched by the component
export const bookSearchPageEvents = eventGroup({
  source: 'Book Search Page',
  events: {
    queryChanged: type<string>(),
    cleared: type<void>(),
  },
});

// API events — dispatched by the store's event handler
export const bookSearchApiEvents = eventGroup({
  source: 'Book Search API',
  events: {
    resultsLoaded: type<BookResult[]>(),
    loadFailed: type<string>(),
  },
});

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  first_publish_year?: number;
}

export const BookSearchEventsStore = signalStore(
  { providedIn: 'root' },
  withState<BookSearchState>({
    query: '',
    results: [],
    loading: false,
    error: null,
  }),
  withStellarDevtools('BookSearchEventsStore', {
    description: `Book search using NgRx event groups and withEventHandlers for async.
Two event groups: bookSearchPageEvents (from UI) and bookSearchApiEvents (from the store's
async handler). Shows how Stellar captures the full causal chain: user types → queryChanged
dispatched → loading state set → HTTP fetch → resultsLoaded dispatched → results state set.`,
    sourceHint: 'apps/demo-ng/src/app/book-search-events.store.ts',
  }),
  withReducer(
    on(bookSearchPageEvents.queryChanged, ({ payload }) => ({
      query: payload,
      loading: true,
      error: null,
      results: [],
    })),
    on(bookSearchPageEvents.cleared, () => ({
      query: '',
      results: [],
      loading: false,
      error: null,
    })),
    on(bookSearchApiEvents.resultsLoaded, ({ payload }) => ({
      results: payload,
      loading: false,
    })),
    on(bookSearchApiEvents.loadFailed, ({ payload }) => ({
      error: payload,
      loading: false,
    })),
  ),
  withEventHandlers((_, events = inject(Events)) => ({
    search$: events.on(bookSearchPageEvents.queryChanged).pipe(
      debounceTime(400),
      filter(({ payload }) => payload.length >= 2),
      switchMap(({ payload }) =>
        from(
          fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(payload)}&limit=8`)
        ).pipe(
          switchMap(r => from(r.json() as Promise<{ docs: OpenLibraryDoc[] }>)),
          map(data =>
            bookSearchApiEvents.resultsLoaded(
              data.docs.slice(0, 8).map(d => ({
                title: d.title,
                author: d.author_name?.[0] ?? 'Unknown',
                year: d.first_publish_year ?? null,
              }))
            )
          ),
          catchError(err => of(bookSearchApiEvents.loadFailed(String(err.message ?? err)))),
        )
      ),
    ),
  })),
);
