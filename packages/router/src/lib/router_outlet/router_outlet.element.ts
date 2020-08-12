import {
  component,
  State,
  OnConnected,
  OnDisconnected,
  JoistElement,
  get,
  InjectorBase,
  property,
} from '@joist/component';
import { Injector } from '@joist/di';
import { MatchFunction, Match, MatchResult } from 'path-to-regexp';

import { Route, Router, RouteCtx, match } from '../router';

export interface RouterOutletState {
  element?: HTMLElement & { [key: string]: any };
  activeRoute?: Route;
}

type RouterOutletLifecycle = OnConnected & OnDisconnected;

@component<RouterOutletState>({
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
export class RouterOutletElement extends JoistElement implements RouterOutletLifecycle {
  @get(State)
  private state!: State<RouterOutletState>;

  @get(Router)
  private router!: Router;

  @property()
  public routes: Route[] = [];

  private matchers: MatchFunction<object>[] = [];
  private removeListener?: Function;

  onPropChanges() {
    this.matchers = this.routes.map((route) => match(route.path));

    if (this.routes.length) {
      this.check();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    this.removeListener = this.router.listen(this.check.bind(this));
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
    } else if (this.state.value.element !== undefined) {
      return this.state.setValue({});
    }

    return Promise.resolve(void 0);
  }

  private resolve(activeRoute: Route, ctx: MatchResult<object>): Promise<void> {
    return Promise.resolve(activeRoute.component()).then((element) => {
      let el: HTMLElement;

      if (typeof element === 'function') {
        el = new element();
      } else {
        el = element;
      }

      const state: RouterOutletState = { element: el, activeRoute };

      // Only set route context if the HTMLElement has am injector attached
      if ('injector' in el) {
        const base = el as InjectorBase;

        if (base.injector instanceof Injector) {
          const routeCtx = base.injector.get(RouteCtx);

          return routeCtx.setValue(ctx).then(() => this.state.setValue(state));
        }
      }

      return this.state.setValue(state);
    });
  }
}
