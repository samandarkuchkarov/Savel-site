/**
 * Пагинация списков админки. Запуск: npm test (tsx --test).
 *
 * Два правила, которые ломаются молча и потому проверяются здесь:
 *  1) первая и последняя страницы обязаны быть в наборе ВСЕГДА — ради этого
 *     всё и переделывалось (до 20-й страницы было 19 кликов);
 *  2) смена размера страницы обязана оставлять читателя у той же записи.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LIMIT, LIST_LIMITS, pageForLimit, pageWindow, parseLimit } from './listPaging.js';

describe('parseLimit — белый список размеров', () => {
  it('разрешённые размеры проходят', () => {
    for (const limit of LIST_LIMITS) assert.equal(parseLimit(String(limit)), limit);
  });

  it('всё остальное — дефолт', () => {
    for (const raw of [undefined, '', '0', '-20', '73', '100000', 'abc', '20.5', 'NaN']) {
      assert.equal(parseLimit(raw), DEFAULT_LIMIT, `limit=${raw}`);
    }
  });
});

describe('pageForLimit — место в списке не теряется', () => {
  it('страница 3 по 20 записей (41–60) → при 50 записях это первая страница', () => {
    assert.equal(pageForLimit(3, 20, 50), 1);
  });

  it('страница 7 по 20 записей (121–140) → при 50 записях это третья (101–150)', () => {
    assert.equal(pageForLimit(7, 20, 50), 3);
  });

  it('уменьшение размера уводит вперёд, а не назад', () => {
    // Страница 2 по 100 (101–200) → при 20 записях запись 101 лежит на 6-й (101–120).
    assert.equal(pageForLimit(2, 100, 20), 6);
  });

  it('тот же размер — та же страница', () => {
    for (const page of [1, 2, 17]) assert.equal(pageForLimit(page, 20, 20), page);
  });

  it('первая страница остаётся первой при любом размере', () => {
    for (const limit of LIST_LIMITS) assert.equal(pageForLimit(1, 20, limit), 1);
  });

  it('результат никогда не меньше 1', () => {
    assert.equal(pageForLimit(0, 20, 50), 1);
    assert.equal(pageForLimit(-5, 20, 50), 1);
  });

  it('первая видимая запись остаётся на новой странице', () => {
    // Свойство целиком: запись, открывавшая старую страницу, обязана попасть
    // в диапазон новой.
    for (const page of [1, 2, 3, 5, 9, 40]) {
      for (const from of LIST_LIMITS) {
        for (const to of LIST_LIMITS) {
          const firstIndex = (page - 1) * from;
          const next = pageForLimit(page, from, to);
          assert.ok(
            firstIndex >= (next - 1) * to && firstIndex < next * to,
            `page=${page} ${from}→${to}: запись ${firstIndex + 1} не попала на страницу ${next}`,
          );
        }
      }
    }
  });
});

describe('pageWindow — набор номеров', () => {
  it('мало страниц — показываем все, без пропусков', () => {
    assert.deepEqual(pageWindow(1, 1), [1]);
    assert.deepEqual(pageWindow(2, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(pageWindow(4, 7), [1, 2, 3, 4, 5, 6, 7]);
  });

  it('первая и последняя страницы есть ВСЕГДА', () => {
    for (const pages of [1, 2, 8, 20, 137]) {
      for (const page of [1, 2, Math.ceil(pages / 2), pages - 1, pages]) {
        if (page < 1) continue;
        const w = pageWindow(page, pages);
        assert.ok(w.includes(1), `нет первой: page=${page}/${pages}`);
        assert.ok(w.includes(pages), `нет последней: page=${page}/${pages}`);
      }
    }
  });

  it('в начале списка пропуск только справа', () => {
    assert.deepEqual(pageWindow(1, 20), [1, 2, 3, 4, 'gap', 20]);
    assert.deepEqual(pageWindow(2, 20), [1, 2, 3, 4, 'gap', 20]);
  });

  it('в середине — пропуски с обеих сторон', () => {
    assert.deepEqual(pageWindow(10, 20), [1, 'gap', 9, 10, 11, 'gap', 20]);
  });

  it('в конце — пропуск только слева', () => {
    assert.deepEqual(pageWindow(20, 20), [1, 'gap', 17, 18, 19, 20]);
    assert.deepEqual(pageWindow(19, 20), [1, 'gap', 17, 18, 19, 20]);
  });

  it("'gap' не стоит там, где пропущена ровно одна страница", () => {
    // 1 … 3 4 5 … 7 было бы враньём: многоточие занимает место номера, но по
    // нему нельзя кликнуть. Одиночные разрывы заполняются самим номером.
    assert.deepEqual(pageWindow(4, 7), [1, 2, 3, 4, 5, 6, 7]);
    // Свойство целиком: между соседними номерами набора либо 1 шаг, либо 'gap'
    // и тогда за ним скрыто минимум ДВЕ страницы.
    for (const pages of [5, 8, 20, 137]) {
      for (let page = 1; page <= pages; page++) {
        const w = pageWindow(page, pages);
        w.forEach((item, i) => {
          if (item !== 'gap') return;
          const before = w[i - 1] as number;
          const after = w[i + 1] as number;
          assert.ok(
            after - before > 2,
            `page=${page}/${pages}: пропуск между ${before} и ${after} скрывает одну страницу`,
          );
        });
      }
    }
  });

  it('номера строго возрастают и не повторяются', () => {
    for (const pages of [1, 3, 12, 60]) {
      for (let page = 1; page <= pages; page++) {
        const nums = pageWindow(page, pages).filter((p): p is number => p !== 'gap');
        for (let i = 1; i < nums.length; i++) {
          assert.ok(nums[i]! > nums[i - 1]!, `page=${page}/${pages}: ${JSON.stringify(nums)}`);
        }
        assert.ok(nums.every(p => p >= 1 && p <= pages), `выход за границы: page=${page}/${pages}`);
      }
    }
  });

  it('набор не разрастается на длинных списках', () => {
    for (let page = 1; page <= 500; page++) {
      assert.ok(pageWindow(page, 500).length <= 7, `слишком много кнопок на page=${page}`);
    }
  });

  it('страница вне диапазона не роняет набор', () => {
    assert.deepEqual(pageWindow(99, 5), [1, 2, 3, 4, 5]);
    assert.deepEqual(pageWindow(0, 5), [1, 2, 3, 4, 5]);
  });
});
