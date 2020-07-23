import {
  Component,
  State,
  OnConnected,
  OnDisconnected,
  JoistElement,
  Get,
  InjectorBase,
} from '@joist/component';
import { Injector } from '@joist/di';
import { MatchFunction, Match, MatchResult } from 'path-to-regexp';

import { Route, Router, RouteCtx } from '../router';

export interface RouterOutletState {
  element?: HTMLElement & { [key: string]: any };
  activeRoute?: Route;
}

@Component<RouterOutletState>({
  state: {},
  render({ state, host }) {
    let child = host.lastElementChild;

    while (child) {
      host.removeChild(child);

      child = host.lastElementChild;
    }

    if (state.element) {
      host.append(state.element);
    }
  },
})
export class RouterOutletElement extends JoistElement implements OnConnected, OnDisconnected {
  @Get(State)
  private state!: State<RouterOutletState>;

  @Get(Router)
  private router!: Router;

  private __routes__: Route[] = [];

  set routes(val: Route[]) {
    this.__routes__ = val;

    this.matchers = this.routes.map((route) => this.router.match(route.path));

    this.check();
  }

  get routes() {
    return this.__routes__;
  }

  private matchers: MatchFunction<object>[] = [];
  private removeListener?: Function;

  connectedCallback() {
    super.connectedCallback();

    this.removeListener = this.router.listen(() => {
      this.check();
    });
  }

  disconnectedCallback() {
    if (this.removeListener) {
      this.removeListener();
    }
  }

  private check(): Promise<void> {
    const fragment = this.router.getFragment();

    let route: Route | null = null;
    let matcher: MatchFunction | null = null;
    let match: Match<object> | null = null;

    for (let i = 0; i < this.matchers.length; i++) {
      route = this.routes[i];
      matcher = this.matchers[i];
      match = matcher(fragment);

      if (match) {
        break;
      }
    }

    if (route && matcher && match) {
      if (!this.state.value.activeRoute || this.state.value.activeRoute.path !== route.path) {
        return this.resolve(route, match);
      }

      return Promise.resolve(void 0);
    }

    return this.state.setValue({});
  }

  private resolve(activeRoute: Route, ctx: MatchResult<object>): Promise<void> {
    return Promise.resolve(activeRoute.component()).then((element) => {
      const state = this.state.setValue({ element, activeRoute });

      // Only set route context if the HTMLElement has am injector attached
      if ('injector' in element) {
        const injectorBase = element as InjectorBase;

        if (injectorBase.injector instanceof Injector) {
          const routeCtx = injectorBase.injector.get(RouteCtx);

          return routeCtx.setValue(ctx).then(() => state);
        }
      }

      return state;
    });
  }
}