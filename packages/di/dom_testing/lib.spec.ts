import { JoistDi } from '@joist/di/dom';
import { expect } from '@open-wc/testing';

import { defineTestBed } from './lib';

describe('testing', () => {
  it('should create a new instance of a custom element with the correct injector root', () => {
    class Foo extends JoistDi(HTMLElement) {}
    customElements.define('testing-0', Foo);

    class MyService {
      title = 'foo';
    }

    const testbed = defineTestBed([
      {
        provide: MyService,
        use: class {
          title = 'bar';
        },
      },
    ]);

    const el = testbed.create(Foo);

    expect(el.injector.get(MyService).title).to.equal('bar');
  });
});
