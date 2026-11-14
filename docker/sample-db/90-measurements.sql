-- One large table, so there is a query that streams for a while and can be cancelled:
--   select * from demo.measurements;
-- A million rows with a number, a timestamp, a decimal and a text, generated rather than downloaded.
create schema demo;

create table demo.measurements as
select g                                                              as id,
       timestamptz '2026-01-01 00:00:00+00' + g * interval '30 seconds' as taken_at,
       1 + (g % 50)                                                    as sensor,
       round((20 + 10 * sin(g / 1000.0) + (g % 7) * 0.25)::numeric, 3) as value,
       'reading ' || g                                                 as note
from generate_series(1, 1000000) as g;

alter table demo.measurements add primary key (id);
create index measurements_sensor_taken_at on demo.measurements (sensor, taken_at);

comment on table demo.measurements is 'A million generated rows, to show streaming and cancel.';

analyze demo.measurements;
