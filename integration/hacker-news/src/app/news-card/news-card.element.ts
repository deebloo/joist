import { State, component, get, JoistElement, property, OnPropChanges } from '@joist/component';
import { template, html } from '@joist/component/lit-html';

import { HackerNewsItem } from '../hacker-news.service';

export type NewsCardState = HackerNewsItem | undefined;

const styles = html`
  <style>
    :host {
      display: block;
      padding: 1rem 1.5rem;
      background: #fff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    }

    .card-content {
      color: gray;
    }

    h3 {
      font-size: 1.1rem;
      margin: 0 0 1.5rem 0;
    }

    h3 a {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      text-decoration: underline;
    }

    a,
    a:hover,
    a:active,
    a:visited {
      color: #000;
      cursor: pointer;
      text-decoration: none;
    }
  </style>
`;

@component<NewsCardState>({
  tagName: 'news-card',
  shadowDom: 'open',
  render: template(({ state }) => {
    return html`
      ${styles}

      <h3>
        <a href=${state?.url}>${state?.title}</a>
      </h3>

      <div class="card-content">
        <p>${state?.points} <b>points</b> by <b>${state?.user}</b> ${state?.time_ago}</p>

        ${state?.comments_count} comments
      </div>
    `;
  }),
})
export class NewsCardElement extends JoistElement implements OnPropChanges {
  @get(State)
  private state!: State<NewsCardState>;

  @property()
  public newsItem?: NewsCardState;

  onPropChanges() {
    this.state.setValue(this.newsItem);
  }
}
