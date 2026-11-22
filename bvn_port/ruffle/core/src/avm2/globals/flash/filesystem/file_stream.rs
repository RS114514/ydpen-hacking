//! `flash.filesystem.FileStream` native methods

use crate::avm2::function::FunctionArgs;
use crate::avm2::parameters::ParametersExt;
use crate::avm2::{Activation, Error, Value};
use std::path::Path;

pub fn native_read_file<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let p = path.to_utf8_lossy();
    let data = std::fs::read(p.as_ref())
        .map_err(|e| Error::rust_error(format!("FileStream read failed ({}): {e}", p).into()))?;

    let ba = activation
        .avm2()
        .classes()
        .bytearray
        .construct(activation, &[])?
        .as_object()
        .unwrap();
    {
        let mut ba_write = ba.as_bytearray_mut().unwrap();
        let _ = ba_write.write_bytes(&data);
        ba_write.set_position(0);
    }
    Ok(ba.into())
}

pub fn native_write_file<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let ba_obj = args.get_object(activation, 1, "data")?;
    let ba_read = ba_obj.as_bytearray().unwrap();
    let p = path.to_utf8_lossy();
    if let Some(parent) = Path::new(p.as_ref()).parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    std::fs::write(p.as_ref(), ba_read.bytes())
        .map_err(|e| Error::rust_error(format!("FileStream write failed ({}): {e}", p).into()))?;
    Ok(Value::Undefined)
}
