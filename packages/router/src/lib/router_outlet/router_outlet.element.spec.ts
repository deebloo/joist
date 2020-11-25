import { State, component, JoistElement, get } from '@joist/component';
import { defineTestBed } from '@joist/component/testing';
import { expect } from '@open-wc/testing';

import { RouterOutletElement, RouterOutletState } from './router_outlet.element';
import { Location, Router, RouteCtx } from '../router';

describe('RouterOutletComponent', () => {
  customElements.define('router-outlet', RouterOutletElement);

  @component({
    tagName: 'router-outlet-test-1',
  })
  class MyElement extends JoistElement {}

  class MockLocation extends Location {
    private path = '/foo';

    getPath() {
      return this.path;
    }

    goTo(path: string) {
      this.path = path;
    }
  }

  let el: RouterOutletElement;
  let state: State<RouterOutletState>;
  let router: Router;

  beforeEach(() => {
    const testBed = defineTestBed([
      {
        provide: Location,
        use: MockLocation,
      },
    ]);

    el = testBed.create(RouterOutletElement);
    state = el.injector.get(State);
    router = testBed.get(Router);
  });

  it('should render the html element when the path matches', (done) => {
    state.onChange((val) => {
      expect(val.element!.tagName).to.equal('FOO-BAR');

      done();
    });

    el.routes = [{ path: '/foo', component: () => document.createElement('foo-bar') }];
  });

  it('should render the html element from a promise when the path matches', (done) => {
    state.onChange((val) => {
      expect(val.element!.tagName).to.equal('FOO-BAR');

      done();
    });

    el.routes = [
      { path: '/foo', component: () => Promise.resolve(document.createElement('foo-bar')) },
    ];
  });

  it('should render a route when passed a CustomElementConstructor', (done) => {
    state.onChange((val) => {
      expect(val.element).to.be.instanceOf(MyElement);

      done();
    });

    el.routes = [{ path: '/foo', component: () => MyElement }];
  });

  it('should render a route when passed a promise resolves to a CustomElementConstructor', (done) => {
    state.onChange((val) => {
      expect(val.element).to.be.instanceOf(MyElement);

      done();
    });

    el.routes = [{ path: '/foo', component: () => Promise.resolve(MyElement) }];
  });

  it('should update the active element when the route changes', (done) => {
    state.onChange((val) => {
      expect(val.element).to.be.instanceOf(MyElement);

      done();
    });

    el.routes = [{ path: '/bar', component: () => MyElement }];

    router.navigate('/bar');
  });

  it('should pass an injectable element the new RouteCtx', (done) => {
    @component({
      tagName: 'router-outlet-test-2',
    })
    class ChildElement extends JoistElement {
      @get(RouteCtx)
      public route!: RouteCtx;
    }

    state.onChange((val) => {
      const el = val.element as ChildElement;

      expect(el.injector.get(RouteCtx).value).to.deep.equal({
        path: 'hello/first/second',
        index: 0,
        params: { foo: 'first', bar: 'second' },
      });

      done();
    });

    el.routes = [{ path: '/hello/:foo/:bar', component: () => ChildElement }];

    router.navigate('/hello/first/second');
  });
});
