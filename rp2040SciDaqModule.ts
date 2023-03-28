

//% block="SCI DAQ Module"
//% weight=100 color=#0fbc11 icon="\uf0b2"
namespace rp2040SciDaqModule {

    export enum SciDaqModuleAddress {
        //% blockId="SciDaqModuleAddress1" block="0x21"
        ADDRESS1 = 0x21,
        //% blockId="SciDaqModuleAddress2" block="0x22"
        ADDRESS2 = 0x22,
        //% blockId="SciDaqModuleAddress3" block="0x23"
        ADDRESS3 = 0x23
    }

    export enum SciDaqModulePort {
        //% blockId="SciDaqModulePortAll" block="ALL"
        PortAll = 0x07,             /**< Port1, Port2, and Port3*/
        //% blockId="SciDaqModulePort1" block="Port1"
        Port1 = 0x01,               /**< Port1, analog or digital sensor port*/
        //% blockId="SciDaqModulePort2" block="Port2"
        Port2 = 0x02,               /**< Port2, I2C or UART sensor port*/
        //% blockId="SciDaqModulePort3" block="Port3"
        Port3 = 0x04                /**< Port3, I2C or UART sensor port*/
    }

    export enum SciDaqModuleReturnDataType {
        //% blockId="SciDaqModuleReturnValueString" block="Value(String)"
        ValueString = 1,
        //% blockId="SciDaqModuleReturnUnitString " block="Unit(String)"
        UnitString = 2
    }

    const Cmd_GET_KEY_VALUE0    = 0x0E          ///< Get the corresponding data value according to the data name
    const CMD_GET_KEY_VALUE1    = 0x0F          ///< Get the data value on the selected port according to the data name
    const CMD_GET_KEY_VALUE2    = 0x10          ///< Get the data value of the designated SKU on the selected port according to the data name
    const CMD_GET_KEY_UINT0     = 0x11          ///< Get the corresponding data unit according to the data name
    const CMD_GET_KEY_UINT1     = 0x12          ///< Get the data unit on the selected port according to the data name
    const CMD_GET_KEY_UINT2     = 0x13          ///< Get the data unit of the designated SKU on the selected port according to the data name
    const CMD_RESET             = 0x14          ///< Reset I2C peripheral(slave) transmitting cache
    const CMD_SKU_A             = 0x15          ///< Get the supported analog sensor SKU 
    const CMD_SKU_D             = 0x16          ///< Get the supported digital sensor SKU
    const CMD_SKU_IIC           = 0x17          ///< Get the supported I2C sensor SKU
    const CMD_SKU_UART          = 0x18          ///< Get the supported UART sensor SKU
    const CMD_GET_TIMESTAMP     = 0x19          ///< Get timestamp
    const CMD_SET_REFRESH_TIME  = 0x20          ///< Set refresh rate
    const CMD_GET_REFRESH_TIME  = 0x20          ///< Get refresh rate
    const CMD_GET_VERSION       = 0x21          ///< Get version number
    const CMD_END               = 0x21

    const STATUS_SUCCESS        = 0x53          ///< Status of successful response   
    const STATUS_FAILED         = 0x63          ///< Status of failed response 

    const DEBUG_TIMEOUT_MS      = 2000

    const ERR_CODE_NONE         = 0x00          ///< Normal communication 
    const ERR_CODE_CMD_INVAILED = 0x01          ///< Invalid command
    const ERR_CODE_RES_PKT      = 0x02          ///< Response packet error
    const ERR_CODE_M_NO_SPACE   = 0x03          ///< Insufficient memory of I2C controller(master)
    const ERR_CODE_RES_TIMEOUT  = 0x04          ///< Response packet reception timeout
    const ERR_CODE_CMD_PKT      = 0x05          ///< Invalid command packet or unmatched command
    const ERR_CODE_SLAVE_BREAK  = 0x06          ///< Peripheral(slave) fault
    const ERR_CODE_ARGS         = 0x07          ///< Set wrong parameter
    const ERR_CODE_SKU          = 0x08          ///< The SKU is an invalid SKU, or unsupported by SCI Acquisition Module
    const ERR_CODE_S_NO_SPACE   = 0x09          ///< Insufficient memory of I2C peripheral(slave)
    const ERR_CODE_I2C_ADRESS   = 0x0A          ///< Invalid I2C address


    let address = 0x21;
    let timeout = 2000;
    let errorCode = 0;

    let recvPkt = { status: 0, cmd: 0, lenL: 0, lenH: 0, buf: [0] };

    /**
    * Initalize the SCI Acquisition Module, mainly for initializing communication interface
    * @param addr 7-bit I2C address, eg: "SciDaqModuleAddress.ADDRESS1"
    */

    //% block="initialize the device until successful ID: %address" 
    //% weight=100
    export function begin(addr: SciDaqModuleAddress): void {
        address = addr;
        init(100000);

    }

    /**
    * Get data values of the attribute named keys from the sensor with a specific sku among sensors connected to the designated port
    * @param port Port select, and parameter search range, eg: "SciDaqModulePort.PortAll"
    * @param key Sensor attribute name, eg: "Analog"
    * @param type to type, eg: "SciDaqModuleReturnDataType.ValueString"
    */

    //% block="get Interface %port %key %type" 
    //% weight=80
    export function getPortValueString(port: SciDaqModulePort, key: string, type: SciDaqModuleReturnDataType): string {
        if (type == SciDaqModuleReturnDataType.ValueString) {
            return getValue(port, key);
        } else {
            return getUnit(port, key);
        }
    }

    /**
    * Get data values of the attribute named keys from the sensor with a specific sku among sensors connected to the designated port
    * @param port Port select, and parameter search range, eg: "SciDaqModulePort.PortAll"
    * @param key Sensor attribute name, eg: "Analog"
    */

    //% block="get Interface %port %key Value(Float)" 
    //% weight=80
    export function getPortValueNumber(port: SciDaqModulePort, key: string): number {
        return parseFloat(getValue(port, key));
    }

    /**
    * Get time stamp, also the data refresh time of SCI Acquisition Module
    */

    //% block="get the refresh time of the latest data" 
    //% weight=60
    export function getTimeStamp(): string {
        let values = "";
        let length = 0;
        let sendpkt = [CMD_GET_TIMESTAMP, length & 0xFF, (length >> 8) & 0xFF];
        sendPacket(sendpkt, 3);

        clearRecvPkt();
        recvPacket(CMD_GET_TIMESTAMP);
        if (recvPkt.status == STATUS_FAILED) { errorCode = recvPkt.buf[0]; }
        if (recvPkt.status == STATUS_SUCCESS) {
            length = (recvPkt.lenH << 8) | recvPkt.lenL;
            for (let i = 0; i < length; i++) {
                values = values + String.fromCharCode(recvPkt.buf[i]);
            }
        }
        return values;
    }

    function init(freq: number): void {
        reset(CMD_RESET);
        clearRecvPkt();

    }

    function reset(cmd: number): void {
        let sendpkt = [CMD_RESET, 1, 0, cmd];
        sendPacket(sendpkt, 4);
        basic.pause(1000);
    }

    function clearRecvPkt(): void {
        recvPkt.status = 0;
        recvPkt.cmd = 0;
        recvPkt.lenL = 0;
        recvPkt.lenH = 0;
        recvPkt.buf = [];
        errorCode = ERR_CODE_NONE;
    }


    function getValue(inf: SciDaqModulePort, keys: string): string {

        if (keys == null) { return ""; }
        let values = "";
        let length = keys.length + 1;
        let sendpkt = [CMD_GET_KEY_VALUE1, length & 0xFF, (length >> 8) & 0xFF, inf];
        for (let i = 0; i < keys.length; i++) {
            sendpkt.push(keys.charCodeAt(i));
        }
        // sendpkt.push(0); //加上"/0"
        sendPacket(sendpkt, 4 + length - 1);

        clearRecvPkt();
        recvPacket(CMD_GET_KEY_VALUE1);
        if (recvPkt.status == STATUS_FAILED) { errorCode = recvPkt.buf[0]; }
        if (recvPkt.status == STATUS_SUCCESS) {
            length = (recvPkt.lenH << 8) | recvPkt.lenL;
            for (let i = 0; i < length; i++) {
                values = values + String.fromCharCode(recvPkt.buf[i]);
            }
        }
        return values;
    }

    function getUnit(inf: SciDaqModulePort, keys: string): string {

        if (keys == null) { return ""; }
        let values = "";
        let length = keys.length + 1;
        let sendpkt = [CMD_GET_KEY_UINT1, length & 0xFF, (length >> 8) & 0xFF, inf];
        for (let i = 0; i < keys.length; i++) {
            sendpkt.push(keys.charCodeAt(i));
        }
        // sendpkt.push(0); //加上"/0"
        sendPacket(sendpkt, 4 + length - 1);

        clearRecvPkt();
        recvPacket(CMD_GET_KEY_UINT1);
        if (recvPkt.status == STATUS_FAILED) { errorCode = recvPkt.buf[0]; }
        if (recvPkt.status == STATUS_SUCCESS) {
            length = (recvPkt.lenH << 8) | recvPkt.lenL;
            for (let i = 0; i < length; i++) {
                values = values + String.fromCharCode(recvPkt.buf[i]);
            }
        }
        return values;
    }

    function sendPacket(data: number[], length: number): void {
        let cmd = pins.createBufferFromArray(data.slice(0, length));

        pins.i2cWriteBuffer(address, cmd, false);
    }

    function recvPacket(cmd: number): void {

        if (cmd > CMD_END) {
            errorCode = ERR_CODE_CMD_INVAILED;
            return;
        }

        let data: Buffer;
        let length = 0;
        let t = control.millis();
        while (control.millis() - t < timeout) {
            recvPkt.status = recvData(1)[0];
            switch(recvPkt.status){
                case STATUS_SUCCESS:
                case STATUS_FAILED:
                {
                    recvPkt.cmd = recvData(1)[0];
                    if (recvPkt.cmd != cmd) {
                        reset(cmd);
                        errorCode = ERR_CODE_RES_PKT;
                        return;
                    }
                    data = recvData(2);
                    recvPkt.lenL = data[0];
                    recvPkt.lenH = data[1];
                    length = (recvPkt.lenH << 8) | recvPkt.lenL;
                    if (length) {
                        data = recvData(length);
                        for (let i = 0; i < length; i++) {
                            recvPkt.buf.push(data[i]);
                        }
                    }
                    return;
                }
            }
            basic.pause(50);
        }
        reset(cmd);
        errorCode = ERR_CODE_RES_TIMEOUT;
        return;
    }

    function recvData(len: number): Buffer {
        return pins.i2cReadBuffer(address, len);
    }


}