// بناء الرسالة للبريد الإلكتروني
function buildEmailMessage(body, attachmentsList) {
  const attachmentsRows = attachmentsList.map((attachment, index) => {
    return `<tr>
              <td style="padding-right: 10px;">${index + 1}</td> <td>${
      attachment.type
    }</td>
              <td>
                <a href=${
                  attachment.path
                } target="_blank" rel="noopener noreferrer">
                  ${
                    attachment.type.startsWith("video/")
                      ? `Video ${index}`
                      : `<img src=${attachment.path} alt="Attachment ${index}" />`
                  }
                </a>
              </td>
            </tr>`;
  });

  const attachmentsHTML = `
    <table border="1" style="direction: rtl;text-align: right;width:100%">
      <thead>
        <tr>
          <th>الرقم</th>
          <th>نوع الملف</th>
          <th>الرابط</th>
        </tr>
      </thead>
      <tbody>
        ${attachmentsRows.join("")}
      </tbody>
    </table>
  `;
  return `<div style="direction: rtl;text-align: right;">
    <table border="1" style="direction: rtl;text-align: right;margin-bottom:16px;">
      <!-- الجدول يتضمن محتوى الرسالة والبيانات من body -->
      <tr>
      <td>الاسم</td>
      <td>${body.name}</td>
    </tr>
    <tr>
      <td>العنوان</td>
      <td>${body.address}</td>
    </tr>
    <tr>
      <td>الهاتف</td>
      <td>${body.phone}</td>
    </tr>
    <tr>
      <td>البريد الإلكتروني</td>
      <td>${body.email}</td>
    </tr>
    <tr>
      <td>نوع الجريمة</td>
      <td>${body.crimeType.title}</td>
    </tr>
    <tr>
      <td>الأطراف المسؤولة</td>
      <td>${body.responsibleParties}</td>
    </tr>
    <tr>
      <td>العلاقة بالجريمة</td>
      <td>${body.relation}</td>
    </tr>
    <tr>
      <td>تاريخ الجريمة</td>
      <td>${body.crimeDate}</td>
    </tr>
    <tr>
      <td>مكان الجريمة</td>
      <td>${body.crimeLocation}</td>
    </tr>
     <tr>
      <td>هل هناك قتلى أو جرحى أو نازحين ؟ </td>
      <td>${body.hasCasualties}</td>
    <tr>
      <td>هل الإحصائية التي تقدمها حول عدد القتلى أو الجرحى هي إحصائية؟</td>
      <td>${body.victims.typeOfStatistic}</td>
    </tr>
    
    <tr>
      <td  rowspan="3">عدد الشهداء</td>
      <td>الكلي</td>
      <td style="width:10%;">${body.victims.numberOfShohada.total}</td>
    </tr>
    <tr>
      <td>منهم نساء</td>
      <td>${body.victims.numberOfShohada.women}</td>
    </tr>
    <tr>
      <td>منهم أطفال</td>
      <td>${body.victims.numberOfShohada.children}</td>
    </tr>
   <tr>
      <td rowspan="3">عدد الجرحى</td>
      <td>الكلي</td>
      <td>${body.victims.numberOfInjured.total}</td>
    </tr>
    <tr>
      <td>نساء</td>
      <td>${body.victims.numberOfInjured.women}</td>
    </tr>
    <tr>
      <td>أطفال</td>
      <td>${body.victims.numberOfInjured.children}</td>
    </tr>
      <td>عدد النازحين/المهجرين</td>
      <td>${body.victims.numberOfDisplaced}</td>
    </tr>
      <tr>
      <td>وصف الجريمة </td>
      <td>${body.crimeDescription}</td>
    <tr> <tr>
      <td> الشروط والخصوصية </td>
      <td>${body.termsAndPrivacy}</td>
    <tr>
     
    </table> 
          <td> الملفات و الدلائل   </td>

    ${attachmentsHTML}
  </div>`;
}



module.exports = { buildEmailMessage };
// =>
// {
//   'name'=> 'الاسم',
//   'address'=> 'العنوان',
//   'phone'=> 'الهاتف',
//   'email'=> 'البريد الإلكتروني',
//   'crimeType'=> 'نوع الجريمة',
//   'responsibleParties'=> 'الأطراف المسؤولة',
//   'relation'=> 'العلاقة بالجريمة',
//   'crimeDate'=> 'تاريخ الجريمة',
//   'crimeLocation'=> 'مكان الجريمة',
//   'hasCasualties'=> 'هل هناك قتلى أو جرحى أو نازحين ؟',
//   'victims'=> {
//     'typeOfStatistic'=>
//       'هل الإحصائية التي تقدمها حول عدد القتلى أو الجرحى هي إحصائية؟',
//     'numberOfShohada'=> {
//       'total'=> 'عدد الشهداء',
//       'women'=> 'منهم نساء',
//       'children'=> 'منهم أطفال',
//     },
//     'numberOfInjured'=> {
//       'total'=> 'عدد الجرحى',
//       'women'=> 'منهم نساء',
//       'children'=> 'منهم أطفال',
//     },
//     'numberOfDisplaced'=> 'عدد النازحين/المهجرين',
//   },
//   'crimeDescription'=> 'وصف الجريمة',
//   'files'=> 'صور أو فيديو',
//   'termsAndPrivacy'=> 'الشروط والخصوصية',
// };

