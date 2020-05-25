import Resource from '../../Resource';

export default class MetricResource extends Resource {

    label;
    timeStamps: Date[];
    values: number[];

    init(label: string, timeStamps: Date[], values: number[]) {
        this.label = label;
        this.timeStamps = timeStamps;
        this.values = values;
        return this;
    }

}