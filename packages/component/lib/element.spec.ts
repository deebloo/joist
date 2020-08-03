import { service } from '@joist/di';

import { JoistElement, get, withInjector } from './element';
import { component } from './component';
import { getEnvironmentRef, clearEnvironment } from './environment';
import { State } from './state';
import { handle } from './handle';

describe('JoistElement', () => {
  describe('withInjector', () => {
    it('should add an injector to any CustomElementConstructor', () => {
      class MyService {}

      class MyElement extends withInjector(HTMLElement) {
        @get(MyService)
        public myService!: MyService;
      }

      customElements.define('withinjector-test-1', MyElement);

      const el = new MyElement();

      expect(el.myService.constructor).toBe(MyService);
    });
  });

  describe('state', () => {
    @component({
      tagName: 'state-test-1',
      state: 0,
      render({ state, host }) {
        host.innerHTML = state.toString();
      },
    })
    class MyElement extends JoistElement {
      @get(State)
      public state!: State<number>;
    }

    it('should update the view when state is updated', async () => {
      const el = new MyElement();

      el.connectedCallback();

      expect(el.innerHTML.trim()).toBe('0');

      await el.state.setValue(el.state.value + 1);

      expect(el.innerHTML.trim()).toBe('1');
    });
  });

  describe('dependency injection', () => {
    it('should map a service to a property', () => {
      @service()
      class MyService {
        helloWorld() {
          return 'Hello World';
        }
      }

      @component({
        tagName: 'di-1',
      })
      class MyElement extends JoistElement {
        @get(MyService) service!: MyService;
      }

      const el = new MyElement();

      expect(el.injector.get(MyService)).toBe(el.service);
      expect(el.service.helloWorld()).toBe('Hello World');
    });

    it('should use scoped providers', () => {
      @service()
      class MyService {
        helloWorld() {
          return 'Hello World';
        }
      }

      @component({
        tagName: 'di-2',
        providers: [{ provide: MyService, use: class extends MyService {} }],
      })
      class MyElement extends JoistElement {
        @get(MyService) service!: MyService;
      }

      const el = new MyElement();

      expect(el.service).toBeInstanceOf(MyService);

      expect(getEnvironmentRef().get(MyService)).not.toBe(el.service);

      clearEnvironment();
    });
  });

  describe('handlers', () => {
    it('should call a function if the trigger is mapped to a class method', () => {
      @component({
        tagName: 'handlers-1',
        render({ run, host }) {
          const button = document.createElement('button');

          button.onclick = run('TEST_RUN', 'Hello World');

          host.append(button);
        },
      })
      class MyElement extends JoistElement {
        @handle('TEST_RUN') onTestRun(_e: Event, _payload: string) {}
      }

      const el = new MyElement();

      spyOn(el, 'onTestRun');

      el.connectedCallback();

      const button = el.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(el.onTestRun).toHaveBeenCalledTimes(1);
      expect(el.onTestRun).toHaveBeenCalledWith(new MouseEvent('click'), 'Hello World');
    });

    it('should handle multiple functions', () => {
      @component({
        tagName: 'handlers-2',
        render({ run, host }) {
          const button = document.createElement('button');

          button.onclick = run('TEST_RUN', 'Hello World');

          host.appendChild(button);
        },
      })
      class MyElement extends JoistElement {
        @handle('TEST_RUN') onTestRun() {}
        @handle('TEST_RUN') onTestRun2() {}
      }

      const el = new MyElement();

      spyOn(el, 'onTestRun');
      spyOn(el, 'onTestRun2');

      el.connectedCallback();

      const button = el.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(el.onTestRun).toHaveBeenCalledTimes(1);
      expect(el.onTestRun2).toHaveBeenCalledTimes(1);
    });

    it('should let one function handle multiple actions', () => {
      @component({
        tagName: 'handlers-3',
        render({ run, host }) {
          const button = document.createElement('button');

          button.addEventListener('click', run('FOO', 'foo'));
          button.addEventListener('click', run('BAR', 'bar'));

          host.append(button);
        },
      })
      class MyElement extends JoistElement {
        @handle('FOO')
        @handle('BAR')
        onTestRun(_e: Event, _payload: string) {}
      }

      const el = new MyElement();

      spyOn(el, 'onTestRun');

      el.connectedCallback();

      const button = el.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(el.onTestRun).toHaveBeenCalledTimes(2);
      expect(el.onTestRun).toHaveBeenCalledWith(new MouseEvent('click'), 'foo');
      expect(el.onTestRun).toHaveBeenCalledWith(new MouseEvent('click'), 'bar');
    });

    it('should allow a user to match on a Regex', () => {
      @component({
        tagName: 'handlers-4',
        render({ run, host }) {
          const button = document.createElement('button');

          button.addEventListener('click', run('foo-bar'));

          host.append(button);
        },
      })
      class MyElement extends JoistElement {
        @handle('foo-*')
        onTestRun(_e: Event, _p: any) {}
      }

      const el = new MyElement();

      spyOn(el, 'onTestRun');

      el.connectedCallback();

      const button = el.querySelector('button') as HTMLButtonElement;

      button.click();

      expect(el.onTestRun).toHaveBeenCalledTimes(1);
      expect(el.onTestRun).toHaveBeenCalledWith(new MouseEvent('click'), undefined);
    });
  });
});
