declare class ConfigObj {
    /** acts as a "recipe" for creating new object/array using an inputObj as the source */
    map?: Object | Array<Object>;
    /** if true, map will change the incoming object; if false, the result of the map operation will replace the incoming object */
    changeMap?: boolean;
    /** if true, modes which receive a Message Stream (target and transform) will map against the full Message Stream object instead of just the record portion */
    mapFullStreamObj?: boolean;
    constructor(initial: any);
}
export declare function targetJson(configObj: ConfigObj): any;
export declare function transformJson(configObj: ConfigObj): any;
export declare function tapJson(configObj: ConfigObj): any;
export {};
