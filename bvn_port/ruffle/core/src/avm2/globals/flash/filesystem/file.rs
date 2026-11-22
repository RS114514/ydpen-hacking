//! `flash.filesystem.File` native methods

use crate::avm2::function::FunctionArgs;
use crate::avm2::object::ArrayObject;
use crate::avm2::parameters::ParametersExt;
use crate::avm2::{Activation, ArrayStorage, Error, Value};
use crate::string::AvmString;
use std::path::{Component, Path, PathBuf};

fn normalize_path(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in path.components() {
        match comp {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push(comp);
                }
            }
            _ => out.push(comp),
        }
    }
    out
}

pub fn native_application_directory<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    _args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let cwd = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
    let s = cwd.to_string_lossy().into_owned();
    Ok(AvmString::new_utf8(activation.gc(), s).into())
}

pub fn native_resolve<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let base = args.get_string_non_null(activation, 0, "base")?;
    let rel = args.get_string_non_null(activation, 1, "rel")?;
    let base_str = base.to_utf8_lossy();
    let rel_str = rel.to_utf8_lossy();

    let joined = if Path::new(rel_str.as_ref()).is_absolute() {
        PathBuf::from(rel_str.as_ref())
    } else {
        Path::new(base_str.as_ref()).join(rel_str.as_ref())
    };
    let norm = normalize_path(&joined);
    let s = norm.to_string_lossy().into_owned();
    Ok(AvmString::new_utf8(activation.gc(), s).into())
}

pub fn native_exists<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let p = path.to_utf8_lossy();
    Ok(Path::new(p.as_ref()).exists().into())
}

pub fn native_is_directory<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let p = path.to_utf8_lossy();
    Ok(Path::new(p.as_ref()).is_dir().into())
}

pub fn native_create_directory<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let p = path.to_utf8_lossy();
    if let Err(e) = std::fs::create_dir_all(p.as_ref()) {
        return Err(Error::rust_error(format!("createDirectory failed: {e}").into()));
    }
    Ok(Value::Undefined)
}

pub fn native_delete_file<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let p = path.to_utf8_lossy();
    if let Err(e) = std::fs::remove_file(p.as_ref()) {
        return Err(Error::rust_error(format!("deleteFile failed: {e}").into()));
    }
    Ok(Value::Undefined)
}

pub fn native_delete_directory<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let recursive = args.get_bool(1);
    let p = path.to_utf8_lossy();
    let res = if recursive {
        std::fs::remove_dir_all(p.as_ref())
    } else {
        std::fs::remove_dir(p.as_ref())
    };
    if let Err(e) = res {
        return Err(Error::rust_error(format!("deleteDirectory failed: {e}").into()));
    }
    Ok(Value::Undefined)
}

pub fn native_list_directory<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let path = args.get_string_non_null(activation, 0, "path")?;
    let p = path.to_utf8_lossy();
    let mut items: Vec<Value<'gc>> = Vec::new();
    if let Ok(entries) = std::fs::read_dir(p.as_ref()) {
        for entry in entries.flatten() {
            let s = entry.path().to_string_lossy().into_owned();
            items.push(AvmString::new_utf8(activation.gc(), s).into());
        }
    }
    let storage = ArrayStorage::from_args(&items);
    Ok(ArrayObject::from_storage(activation.context, storage).into())
}

pub fn native_move_to<'gc>(
    activation: &mut Activation<'_, 'gc>,
    _this: Value<'gc>,
    args: FunctionArgs<'_, 'gc>,
) -> Result<Value<'gc>, Error<'gc>> {
    let src = args.get_string_non_null(activation, 0, "src")?;
    let dst = args.get_string_non_null(activation, 1, "dst")?;
    let overwrite = args.get_bool(2);
    let src_p = src.to_utf8_lossy();
    let dst_p = dst.to_utf8_lossy();
    if !overwrite && Path::new(dst_p.as_ref()).exists() {
        return Err(Error::rust_error("moveTo destination exists".into()));
    }
    if let Some(parent) = Path::new(dst_p.as_ref()).parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Err(e) = std::fs::rename(src_p.as_ref(), dst_p.as_ref()) {
        return Err(Error::rust_error(format!("moveTo failed: {e}").into()));
    }
    Ok(Value::Undefined)
}
